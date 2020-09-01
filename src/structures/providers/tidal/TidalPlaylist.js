const Playlist = require('../../lavacord/Playlist')
const TidalSong = require('./TidalSong')

class TidalPlaylist extends Playlist {
  constructor (tracks, info, provider) {
    super(tracks.map(track => new TidalSong(track, provider)), info, provider)
  }

  get title () {
    return this.info.title
  }

  get source () {
    return 'tidal'
  }

  fetchExtraInfo () {
    return this.info
  }
}

module.exports = TidalPlaylist
