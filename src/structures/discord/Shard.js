const Bucket = require('./Bucket')
const { GATEWAY_VERSION, GatewayOPCodes } = require('../../utils/Constants')
let WebSocket = typeof window !== 'undefined' ? window.WebSocket : require('ws')

let EventEmitter
try {
  EventEmitter = require('eventemitter3')
} catch (err) {
  EventEmitter = require('events').EventEmitter
}
let Erlpack
try {
  Erlpack = require('erlpack')
} catch (err) {
}
let ZlibSync
try {
  ZlibSync = require('zlib-sync')
} catch (err) {
  try {
    ZlibSync = require('pako')
  } catch (err) {
  }
}
try {
  WebSocket = require('uws')
} catch (err) {
}

class Shard extends EventEmitter {
  constructor (id, client) {
    super()

    this.id = id
    this.client = client

    this.onWSMessage = this.onWSMessage.bind(this)

    this.hardReset()
  }

  get latency () {
    return this.lastHeartbeatSent && this.lastHeartbeatReceived ? this.lastHeartbeatReceived - this.lastHeartbeatSent : Infinity
  }

  connect () {
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.emit('error', new Error('Existing connection detected'), this.id)
      return
    }
    ++this.connectAttempts
    this.connecting = true
    return this.initializeWS()
  }

  disconnect (options = {}, error) {
    if (!this.ws) {
      return
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    this.ws.onclose = undefined
    try {
      if (options.reconnect && this.sessionID) {
        this.ws.terminate()
      } else {
        this.ws.close(1000)
      }
    } catch (err) {
      this.emit('error', err, this.id)
    }

    this.ws = null
    this.reset()

    super.emit('disconnect', error || null)

    if (options.reconnect === 'auto' && this.client.options.autoreconnect) {
      if (this.sessionID) {
        this.emit('debug', `Immediately reconnecting for potential resume | Attempt ${this.connectAttempts}`, this.id)
        this.client.shards.connect(this)
      } else {
        this.emit('debug', `Queueing reconnect in ${this.reconnectInterval}ms | Attempt ${this.connectAttempts}`, this.id)
        setTimeout(() => {
          this.client.shards.connect(this)
        }, this.reconnectInterval)
        this.reconnectInterval = Math.min(Math.round(this.reconnectInterval * (Math.random() * 2 + 1)), 30000)
      }
    } else if (!options.reconnect) {
      this.hardReset()
    }
  }

  reset () {
    this.connecting = false
    this.ready = false
    this.preReady = false
    this.lastHeartbeatAck = true
    this.lastHeartbeatReceived = null
    this.lastHeartbeatSent = null
    this.status = 'disconnected'
  }

  hardReset () {
    this.reset()
    this.seq = 0
    this.sessionID = null
    this.reconnectInterval = 1000
    this.connectAttempts = 0
    this.ws = null
    this.heartbeatInterval = null
    this.globalBucket = new Bucket(120, 60000, { reservedTokens: 5 })
  }

  resume () {
    this.status = 'resuming'
    this.sendWS(GatewayOPCodes.RESUME, {
      token: this.client.token,
      session_id: this.sessionID,
      seq: this.seq
    })
  }

  identify () {
    if (this.client.options.compress && !ZlibSync) {
      this.emit('error', new Error('pako/zlib-sync not found, cannot decompress data'))
      return
    }
    const identify = {
      token: this.client.token,
      v: GATEWAY_VERSION,
      compress: !!this.client.options.compress,
      large_threshold: this.client.options.largeThreshold,
      guild_subscriptions: !!this.client.options.guildSubscriptions,
      intents: this.client.options.intents,
      properties: {
        os: process.platform,
        browser: 'SwitchbladeMusic',
        device: 'SwitchbladeMusic'
      }
    }
    this.sendWS(GatewayOPCodes.IDENTIFY, identify)
  }

  wsEvent (packet) {
    switch (packet.t) {
      case 'RESUMED':
      case 'READY': {
        this.connectAttempts = 0
        this.reconnectInterval = 1000

        this.connecting = false
        this.status = 'ready'
        this.client.shards._readyPacketCB()

        if (packet.t === 'RESUMED') {
          this.preReady = true
          this.ready = true

          super.emit('resume')
          break
        }

        if (!this.client.token.startsWith('Bot ')) {
          this.client.token = 'Bot ' + this.client.token
        }

        if (packet.d._trace) {
          this.discordServerTrace = packet.d._trace
        }

        this.sessionID = packet.d.session_id

        this.preReady = true
        this.emit('shardPreReady', this.id)

        this.checkReady()

        break
      }
      case 'VOICE_SERVER_UPDATE': {
        packet.d.session_id = this.sessionID
        packet.d.shard = this
        break
      }
      case 'GUILD_CREATE': {
        if (!packet.d.unavailable) {
          this.client.guildShardMap[packet.d.id] = this.id
        }
      }
      default: {
        this.emit('unknown', packet, this.id)
        break
      }
    } /* eslint-enable no-redeclare */
  }

  checkReady () {
    if (!this.ready) {
      this.ready = true
      super.emit('ready')
    }
  }

  initializeWS () {
    if (!this.client.token) {
      return this.disconnect(null, new Error('Token not specified'))
    }

    this.status = 'connecting'
    if (this.client.options.compress) {
      this.emit('debug', 'Initializing zlib-sync-based compression')
      this._zlibSync = new ZlibSync.Inflate({
        chunkSize: 128 * 1024
      })
    }
    this.ws = new WebSocket(this.client.gatewayURL, this.client.options.ws)
    this.ws.onopen = () => {
      this.status = 'handshaking'
      this.emit('connect', this.id)
      this.lastHeartbeatAck = true
    }
    this.ws.onmessage = (m) => {
      try {
        let { data } = m
        if (data instanceof ArrayBuffer) {
          if (this.client.options.compress || Erlpack) {
            data = Buffer.from(data)
          }
        } else if (Array.isArray(data)) { // Fragmented messages
          data = Buffer.concat(data) // Copyfull concat is slow, but no alternative
        }
        if (this.client.options.compress) {
          if (data.length >= 4 && data.readUInt32BE(data.length - 4) === 0xFFFF) {
            this._zlibSync.push(data, ZlibSync.Z_SYNC_FLUSH)
            if (this._zlibSync.err) {
              this.emit('error', new Error(`zlib error ${this._zlibSync.err}: ${this._zlibSync.msg}`))
              return
            }

            data = Buffer.from(this._zlibSync.result)
            if (Erlpack) {
              this.onWSMessage(Erlpack.unpack(data))
            } else {
              return this.onWSMessage(JSON.parse(data.toString()))
            }
          } else {
            this._zlibSync.push(data, false)
          }
        } else if (Erlpack) {
          return this.onWSMessage(Erlpack.unpack(data))
        } else {
          return this.onWSMessage(JSON.parse(data.toString()))
        }
      } catch (err) {
        this.emit('error', err, this.id)
      }
    }
    this.ws.onerror = (event) => {
      this.emit('error', event, this.id)
    }
    this.ws.onclose = (event) => {
      let err = !event.code || event.code === 1000 ? null : new Error(event.code + ': ' + event.reason)
      let reconnect = 'auto'
      if (event.code) {
        this.emit('debug', `${event.code === 1000 ? 'Clean' : 'Unclean'} WS close: ${event.code}: ${event.reason}`, this.id)
        if (event.code === 4001) {
          err = new Error('Gateway received invalid OP code')
        } else if (event.code === 4002) {
          err = new Error('Gateway received invalid message')
        } else if (event.code === 4003) {
          err = new Error('Not authenticated')
          this.sessionID = null
        } else if (event.code === 4004) {
          err = new Error('Authentication failed')
          this.sessionID = null
          reconnect = false
          this.emit('error', new Error(`Invalid token: ${this.client.token}`))
        } else if (event.code === 4005) {
          err = new Error('Already authenticated')
        } else if (event.code === 4006 || event.code === 4009) {
          err = new Error('Invalid session')
          this.sessionID = null
        } else if (event.code === 4007) {
          err = new Error('Invalid sequence number: ' + this.seq)
          this.seq = 0
        } else if (event.code === 4008) {
          err = new Error('Gateway connection was ratelimited')
        } else if (event.code === 4010) {
          err = new Error('Invalid shard key')
          this.sessionID = null
          reconnect = false
        } else if (event.code === 4011) {
          err = new Error('Shard has too many guilds (>2500)')
          this.sessionID = null
          reconnect = false
        } else if (event.code === 4013) {
          err = new Error('Invalid intents specified')
          this.sessionID = null
          reconnect = false
        } else if (event.code === 4014) {
          err = new Error('Disallowed intents specified')
          this.sessionID = null
          reconnect = false
        } else if (event.code === 1006) {
          err = new Error('Connection reset by peer')
        } else if (!event.wasClean && event.reason) {
          err = new Error(event.code + ': ' + event.reason)
        }
      } else {
        this.emit('debug', 'WS close: unknown code: ' + event.reason, this.id)
      }
      this.disconnect({
        reconnect
      }, err)
    }

    setTimeout(() => {
      if (this.connecting) {
        this.disconnect({
          reconnect: 'auto'
        }, new Error('Connection timeout'))
      }
    }, this.client.options.connectionTimeout)
  }

  onWSMessage (packet) {
    if (this.listeners('rawWS').length > 0 || this.client.listeners('rawWS').length) {
      this.client.emit('rawWS', packet, this.id)
    }

    if (packet.s) {
      if (packet.s > this.seq + 1 && this.ws && this.status !== 'resuming') {
        this.emit('warn', `Non-consecutive sequence (${this.seq} -> ${packet.s})`, this.id)
      }
      this.seq = packet.s
    }

    switch (packet.op) {
      case GatewayOPCodes.EVENT: {
        if (!this.client.options.disableEvents[packet.t]) {
          this.wsEvent(packet)
        }
        break
      }
      case GatewayOPCodes.HEARTBEAT: {
        this.heartbeat()
        break
      }
      case GatewayOPCodes.INVALID_SESSION: {
        this.seq = 0
        this.sessionID = null
        this.emit('warn', 'Invalid session, reidentifying!', this.id)
        this.identify()
        break
      }
      case GatewayOPCodes.RECONNECT: {
        this.disconnect({
          reconnect: 'auto'
        })
        break
      }
      case GatewayOPCodes.HELLO: {
        if (packet.d.heartbeat_interval > 0) {
          if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
          }
          this.heartbeatInterval = setInterval(() => this.heartbeat(true), packet.d.heartbeat_interval)
        }

        this.discordServerTrace = packet.d._trace
        this.connecting = false

        if (this.sessionID) {
          this.resume()
        } else {
          this.identify()
        }
        this.heartbeat()
        this.emit('hello', packet.d._trace, this.id)
        break
      }
      case GatewayOPCodes.HEARTBEAT_ACK: {
        this.lastHeartbeatAck = true
        this.lastHeartbeatReceived = new Date().getTime()
        break
      }
      default: {
        this.emit('unknown', packet, this.id)
        break
      }
    }
  }

  heartbeat (normal) {
    if (normal && !this.lastHeartbeatAck) {
      return this.disconnect({
        reconnect: 'auto'
      }, new Error("Server didn't acknowledge previous heartbeat, possible lost connection"))
    }
    this.lastHeartbeatAck = false
    this.lastHeartbeatSent = new Date().getTime()
    this.sendWS(GatewayOPCodes.HEARTBEAT, this.seq, true)
  }

  sendWS (op, _data, priority = false) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      let i = 0
      let waitFor = 1
      const func = () => {
        if (++i >= waitFor && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const data = Erlpack ? Erlpack.pack({ op: op, d: _data }) : JSON.stringify({ op: op, d: _data })
          this.ws.send(data)
          this.emit('debug', JSON.stringify({ op: op, d: _data }), this.id)
        }
      }
      if (op === GatewayOPCodes.STATUS_UPDATE) {
        ++waitFor
        this.presenceUpdateBucket.queue(func, priority)
      }
      this.globalBucket.queue(func, priority)
    }
  }

  emit (event, ...args) {
    super.emit.call(this, event, ...args)
  }
}

module.exports = Shard
