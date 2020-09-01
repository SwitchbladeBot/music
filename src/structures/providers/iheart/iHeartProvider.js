const iHeartAPI = require('../../../apis/iHeart')
const iHeartSong = require('./iHeartSong')

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
            return new iHeartSong(station, track, info, provider)
          }
        }
      }
    }
  }

  static getBestStream ({ streams: { secure_shoutcast_stream, secure_pls_stream, shoutcast_stream, pls_stream } }) {
    return secure_shoutcast_stream || secure_pls_stream || shoutcast_stream || pls_stream
  }
}

module.exports = iHeartProvider
