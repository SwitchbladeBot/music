const Song = require('../../lavacord/Song')

class iHeartSong extends Song {
  constructor (stationInfo, track, info, provider) {
    super(track, info, provider)
    this.stationInfo = stationInfo
  }

  get title () {
    return this.stationInfo.name
  }

  get uri () {
    return this.stationInfo.link
  }

  get identifier () {
    return this.stationInfo.id
  }

  get source () {
    return 'iheart'
  }
}

module.exports = iHeartSong
