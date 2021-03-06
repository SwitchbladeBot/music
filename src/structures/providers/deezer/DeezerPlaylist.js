const Playlist = require('../../lavacord/Playlist')
const DeezerSong = require('./DeezerSong')

class DeezerPlaylist extends Playlist {
  constructor (tracks, info, provider) {
    super(tracks.map((track) => new DeezerSong(track, provider)), info, provider)
  }

  get title () {
    return this.info.title
  }

  get source () {
    return 'deezer'
  }

  fetchExtraInfo () {
    return this.info
  }
}

module.exports = DeezerPlaylist
