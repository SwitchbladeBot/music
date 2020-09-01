const Song = require('../../lavacord/Song')

class SpotifySong extends Song {
  constructor (tidalTrack, provider) {
    super(null, null, provider)

    this.tidalTrack = tidalTrack
  }

  get title () {
    return this.tidalTrack.title
  }

  get author () {
    return this.tidalTrack.artists.map(a => a.name).join(', ')
  }

  get identifier () {
    return this.tidalTrack.id
  }

  get uri () {
    return this.tidalTrack.url
  }

  get source () {
    return 'tidal'
  }

  fetchExtraInfo () {
    return this.tidalTrack
  }
}

module.exports = SpotifySong
