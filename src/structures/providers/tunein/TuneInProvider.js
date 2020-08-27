const TuneInAPI = require('../../../apis/TuneIn')
const TuneInSong = require('./TuneInSong')

const TUNEIN_REGEX = /^(?:https?:\/\/|)?(?:www\.)?tunein\.com\/radio\/([0-9A-Za-z-_()]*(s\d+))/g

class TuneInProvider {
  static async get (provider, identifier) {
    const regexResult = TUNEIN_REGEX.exec(identifier)
    if (regexResult) {
      const [, path, id] = regexResult
      const [{ url }, radioInfo] = await Promise.all([TuneInAPI.get(id), TuneInAPI.fetch(path, id)])
      const { tracks } = await provider.loadTracks(url, 1)
      if (tracks && tracks.length) {
        const [{ track, info }] = tracks
        return new TuneInSong(radioInfo, track, info, provider)
      }
    }
  }
}

module.exports = TuneInProvider
