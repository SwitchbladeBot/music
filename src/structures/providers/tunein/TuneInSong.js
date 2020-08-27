const Song = require('../../lavacord/Song')

class TuneInSong extends Song {
  constructor (radioInfo, track, info, provider) {
    super(track, info, provider)
    this.radioInfo = radioInfo
  }

  get title () {
    return this.radioInfo.title
  }

  get uri () {
    return this.radioInfo.shortUrl
  }

  get source () {
    return 'tunein'
  }
}

module.exports = TuneInSong
