const iHeartAPI = require('../../../apis/iHeart')
const IHeartSong = require('./iHeartSong')

const IHEART_REGEX = /^(?:https?:\/\/|)?(?:www\.)?iheart\.com\/live\/(\d+)/g

class iHeartProvider {
  static async get (provider, identifier) {
    const regexResult = IHEART_REGEX.exec(identifier)
    if (regexResult) {
      const [, id] = regexResult
      const station = await iHeartAPI.getStation(id)
      if (station) {
        const url = this.getBestStream(station)
        if (url) {
          const { tracks } = await provider.loadTracks(url, 1)
          if (tracks && tracks.length) {
            const [{ track, info }] = tracks
            return new IHeartSong(station, track, info, provider)
          }
        }
      }
    }
  }

  static getBestStream ({
    streams: {
      secure_shoutcast_stream: secureShoutcast,
      secure_pls_stream: securePls,
      shoutcast_stream: shoutcast,
      pls_stream: pls
    }
  }) {
    return secureShoutcast || securePls || shoutcast || pls
  }
}

module.exports = iHeartProvider
