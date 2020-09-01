const { EventEmitter } = require('events')
const { lookup } = require('dns')
const { promisify } = require('util')
const dnsLookup = promisify(lookup)

class NodePool extends EventEmitter {
  constructor (
    hostname = 'tasks.lavalink',
    port = process.env.LAVALINK_PORT,
    password = process.env.LAVALINK_PASSWORD
  ) {
    super()
    this.hostname = hostname
    this.port = port
    this.password = password

    this.nodes = {}
  }

  startLookupService () {
    setInterval(() => this.getNewNodes(), 6E5) // 10 minutes
  }

  async getNewNodes () {
    const nodes = await this.getAllNodes(false)
    return nodes.map(node => this.addNode(node)).filter(n => n)
  }

  async getAllNodes (autoAdd = true) {
    const addresses = await dnsLookup(this.hostname, { all: true })
    return addresses.map(host => {
      const node = {
        id: host,
        host,
        port: process.env.LAVALINK_PORT,
        password: process.env.LAVALINK_PASSWORD
      }
      if (autoAdd) this.addNode(node, false)
      return node
    })
  }

  addNode (node, emit = true) {
    if (this.nodes[node.id]) return
    this.nodes[node.id] = node
    if (emit) this.emit('newNode', node)
    return node
  }
}

module.exports = NodePool
