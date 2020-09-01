const Song = require('../../lavacord/Song')

class DeezerSong extends Song {
  constructor (deezerTrack, provider) {
    super(null, null, provider)

    this.deezerTrack = deezerTrack
  }

  get title () {
    return this.deezerTrack.title
  }

  get author () {
    return this.deezerTrack.artist.name
  }

  get identifier () {
    return this.deezerTrack.id
  }

  get uri () {
    return this.deezerTrack.link
  }

  get source () {
    return 'deezer'
  }

  fetchExtraInfo () {
    return this.deezerTrack
  }
}

module.exports = DeezerSong
