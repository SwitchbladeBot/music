const fetch = require('node-fetch')
const { URLSearchParams } = require('url')

const Song = require('../lavacord/Song')
const Playlist = require('../lavacord/Playlist')

// Providers
const DeezerProvider = require('./deezer/DeezerProvider')
const SpotifyProvider = require('./spotify/SpotifyProvider')
const TuneInProvider = require('./tunein/TuneInProvider')
const PROVIDERS = [DeezerProvider, SpotifyProvider, TuneInProvider]

class SongProvider {
  constructor (manager) {
    this.manager = manager
  }

  loadTracks (identifier, limit) {
    const [node] = this.manager.lavalink.idealNodes
    const params = new URLSearchParams()
    params.append('identifier', identifier)
    return fetch(`http://${node.host}:${node.port}/loadtracks?${params}`, { headers: { Authorization: node.password } })
      .then(res => res.json())
      .then(res => {
        if (res.exception) return Promise.reject(res.exception)
        if (limit) res.tracks = res.tracks.slice(0, limit)
        return res
      })
      .catch(err => {
        console.error(err)
        return {}
      })
  }

  async get (identifier, ignoreProviders = false) {
    let alternativeLoad
    try {
      if (!ignoreProviders) alternativeLoad = await this.alternativeLoad(identifier)
    } catch (e) {
      console.error(e)
    }

    return alternativeLoad || this.loadTracks(identifier).then(({ tracks, loadType, playlistInfo }) => {
      if (!loadType) return
      if (loadType === 'PLAYLIST_LOADED') {
        // Load playlist
        console.log(playlistInfo)
        if (playlistInfo.selectedTrack !== -1) {
          tracks = [...tracks.slice(playlistInfo.selectedTrack), ...tracks.slice(0, playlistInfo.selectedTrack)]
        }
        return new Playlist(tracks.map(({ track, info }) => new Song(track, info)), playlistInfo, this)
      } else if (tracks.length) {
        const [{ track, info }] = tracks
        return new Song(track, info)
      }
    })
  }

  async alternativeLoad (identifier) {
    for (const provider of PROVIDERS) {
      const result = await provider.get(this, identifier)
      if (result) return result
    }
  }
}

module.exports = SongProvider
