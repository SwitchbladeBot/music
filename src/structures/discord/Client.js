const Constants = require('../../utils/Constants')
const ShardManager = require('./ShardManager')

const fetch = require('node-fetch')
let EventEmitter
try {
  EventEmitter = require('eventemitter3')
} catch (err) {
  EventEmitter = require('events')
}
let Erlpack
try {
  Erlpack = require('erlpack')
} catch (err) {
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

class Client extends EventEmitter {
  constructor (token, options) {
    super()
    this.options = Object.assign({
      autoreconnect: true,
      compress: false,
      connectionTimeout: 30000,
      disableEvents: {},
      firstShardID: 0,
      largeThreshold: 250,
      latencyThreshold: 30000,
      maxShards: 1,
      messageLimit: 100,
      opusOnly: false,
      ratelimiterOffset: 0,
      requestTimeout: 15000,
      restMode: false,
      seedVoiceConnections: false,
      ws: {},
      agent: null,
      maxReconnectAttempts: Infinity,
      reconnectDelay: (lastDelay, attempts) => Math.pow(attempts + 1, 0.7) * 20000
    }, options)
    if (this.options.lastShardID === undefined && this.options.maxShards !== 'auto') {
      this.options.lastShardID = this.options.maxShards - 1
    }
    if (this.options.agent && !(this.options.ws && this.options.ws.agent)) {
      this.options.ws = this.options.ws || {}
      this.options.ws.agent = this.options.agent
    }
    if (Object.prototype.hasOwnProperty.call(this.options, 'intents')) {
      // Resolve intents option to the proper integer
      if (Array.isArray(this.options.intents)) {
        let bitmask = 0
        for (const intent of this.options.intents) {
          if (Constants.Intents[intent]) {
            bitmask |= Constants.Intents[intent]
          }
        }
        this.options.intents = bitmask
      }

      // Ensure requesting all guild members isn't destined to fail
      if (this.options.getAllUsers && !(this.options.intents & Constants.Intents.guildMembers)) {
        throw new Error('Cannot request all members without guildMembers intent')
      }
    }

    this.token = token
    this.userId = this.options.userId
    this.startTime = 0
    this.lastConnect = 0
    this.shards = new ShardManager(this)
    this.guildShardMap = {}

    this.connect = this.connect.bind(this)
    this.lastReconnectDelay = 0
    this.reconnectAttempts = 0
  }

  get uptime () {
    return this.startTime ? Date.now() - this.startTime : 0
  }

  async connect () {
    try {
      const data = await (this.options.maxShards === 'auto' ? this.getBotGateway() : this.getGateway())
      if (!data.url || (this.options.maxShards === 'auto' && !data.shards)) {
        throw new Error('Invalid response from gateway REST call')
      }
      if (data.url.includes('?')) {
        data.url = data.url.substring(0, data.url.indexOf('?'))
      }
      if (!data.url.endsWith('/')) {
        data.url += '/'
      }
      this.gatewayURL = `${data.url}?v=${Constants.GATEWAY_VERSION}&encoding=${Erlpack ? 'etf' : 'json'}`

      if (this.options.compress) {
        this.gatewayURL += '&compress=zlib-stream'
      }

      if (this.options.maxShards === 'auto') {
        if (!data.shards) {
          throw new Error('Failed to autoshard due to lack of data from Discord.')
        }
        this.options.maxShards = data.shards
        if (this.options.lastShardID === undefined) {
          this.options.lastShardID = data.shards - 1
        }
      }

      for (let i = this.options.firstShardID; i <= this.options.lastShardID; ++i) {
        this.shards.spawn(i)
      }
    } catch (err) {
      console.error(err)
      if (!this.options.autoreconnect) {
        throw err
      }
      const reconnectDelay = this.options.reconnectDelay(this.lastReconnectDelay, this.reconnectAttempts)
      await sleep(reconnectDelay)
      this.lastReconnectDelay = reconnectDelay
      this.reconnectAttempts = this.reconnectAttempts + 1
      return this.connect()
    }
  }

  getGateway () {
    return this.restRequest('GET', Constants.Endpoints.GATEWAY)
  }

  getBotGateway () {
    if (!this.token.startsWith('Bot ')) {
      this.token = 'Bot ' + this.token
    }
    return this.restRequest('GET', Constants.Endpoints.GATEWAY_BOT, true)
  }

  restRequest (method, endpoint, auth) {
    const options = { method }
    if (auth) {
      options.headers = {
        Authorization: this.token
      }
    }
    return fetch('https://discordapp.com' + Constants.REST_BASE_URL + endpoint, options).then(res => res.json())
  }
}

module.exports = Client
