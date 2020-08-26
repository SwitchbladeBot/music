const fetch = require('node-fetch')
const { URLSearchParams } = require('url')

const Song = require('../lavacord/Song')

const SpotifyProvider = require('./spotify/SpotifyProvider')
const PROVIDERS = [SpotifyProvider]

class SongProvider {
  constructor (manager) {
    this.manager = manager
  }

  loadTracks (identifier, limit = 1, songConstructor = Song) {
    const [node] = this.manager.lavalink.idealNodes
    const params = new URLSearchParams()
    params.append('identifier', identifier)
    return fetch(`http://${node.host}:${node.port}/loadtracks?${params}`, { headers: { Authorization: node.password } })
      .then(res => res.json())
      .then(({ exception, tracks }) => {
        if (exception) return Promise.reject(exception)
        return tracks.slice(0, limit).map(({ track, info }) => songConstructor(track, info))
      })
      .catch(err => {
        console.error(err)
        return []
      })
  }

  async get (identifier) {
    let alternativeLoad
    try {
      alternativeLoad = await this.alternativeLoad(identifier)
    } catch (e) {
      console.error(e)
    }
    return alternativeLoad || this.loadTracks(identifier)
  }

  async alternativeLoad (identifier) {
    for (const provider of PROVIDERS) {
      const result = await provider.get(this, identifier)
      if (result) return result
    }
  }
}

module.exports = SongProvider
