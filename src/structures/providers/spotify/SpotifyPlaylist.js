const Playlist = require('../../lavacord/Playlist')
const SpotifySong = require('./SpotifySong')

class SpotifyPlaylist extends Playlist {
  constructor (tracks, info, provider) {
    super(tracks.map(track => new SpotifySong(track, provider)), info, provider)
  }

  get title () {
    return this.info.name
  }

  get source () {
    return 'spotify'
  }

  fetchExtraInfo () {
    return this.info
  }
}

module.exports = SpotifyPlaylist
