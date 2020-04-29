const Client = require('./discord/Client')
const LavacordManager = require('./lavacord/Manager')
const MusicPlayer = require('./lavacord/MusicPlayer')
const APIController = require('./http/APIController')

const fetch = require('node-fetch')
const { URLSearchParams } = require('url')

const { promisify } = require('util')
const { lookup } = require('dns')
const dnsLookup = promisify(lookup)

// TODO: Create SongProvider class
class MusicManager {
  constructor (clientOptions, lavacordOptions = {}) {
    this.clientOptions = clientOptions || {}
    this.lavacordOptions = Object.assign({
      Player: MusicPlayer
    }, lavacordOptions)

    this.handleClientError = this.handleClientError.bind(this)
  }

  connect () {
    return this.connectClient()
      .then(() => this.connectLavalink())
      .then(() => this.startHTTPServer())
  }

  // Discord
  connectClient () {
    const CLUSTER_ID = process.env.INDEX_CLUSTER_ID_FROM_ONE ? parseInt(process.env.CLUSTER_ID) - 1 : parseInt(process.env.CLUSTER_ID)
    const maxShards = parseInt(process.env.MAX_SHARDS)
    const firstShardID = maxShards ? 0 : CLUSTER_ID * parseInt(process.env.SHARDS_PER_CLUSTER)
    const lastShardID = maxShards ? maxShards - 1 : ((CLUSTER_ID + 1) * parseInt(process.env.SHARDS_PER_CLUSTER)) - 1

    this.client = new Client(process.env.DISCORD_TOKEN, Object.assign({
      compress: true,
      userId: process.env.USER_ID,
      firstShardID,
      lastShardID,
      maxShards: maxShards || parseInt(process.env.SHARDS_PER_CLUSTER) * parseInt(process.env.MAX_CLUSTERS)
    }, this.clientOptions))

    this.client.on('error', this.handleClientError)

    return this.client.connect()
  }

  handleClientError (...args) {
    console.error('CLIENT', ...args)
  }

  // Lavalink
  async connectLavalink () {
    const nodes = await this.lavalinkNodes()
    this.lavalink = new LavacordManager(this.client, nodes, this.lavacordOptions)
    return this.lavalink.connect()
  }

  async lavalinkNodes () {
    let lavalinkNodes
    try {
      lavalinkNodes = require.main.require('../lavalink_nodes.json')
    } catch (err) {}

    if (!lavalinkNodes) {
      const addresses = await dnsLookup('tasks.lavalink', { all: true })
      lavalinkNodes = addresses.map((host, i) => ({
        id: i++,
        host,
        port: process.env.LAVALINK_PORT,
        password: process.env.LAVALINK_PASSWORD
      }))
    }

    return lavalinkNodes
  }

  getSongs (search) {
    const [node] = this.lavalink.idealNodes
    const params = new URLSearchParams()
    params.append('identifier', search)
    return fetch(`http://${node.host}:${node.port}/loadtracks?${params}`, { headers: { Authorization: node.password } })
      .then(res => res.json())
      .then(data => data.tracks)
      .catch(err => {
        console.error(err)
        return []
      })
  }

  // HTTP
  startHTTPServer () {
    this.api = new APIController(this)
    return this.api.start(process.env.PORT)
  }
}

module.exports = MusicManager
