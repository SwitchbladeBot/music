const TuneInAPI = require('../../../apis/TuneIn')

const TUNEIN_REGEX = /tunein\.com\/radio\/[0-9A-Za-z-_()]*(s\d+)/g

class TuneInProvider {
  static async get (provider, identifier) {
    const regexResult = TUNEIN_REGEX.exec(identifier)
    if (regexResult) {
      const [, id] = regexResult
      const { url } = await TuneInAPI.get(id)
      return provider.get(url, true)
    }
  }
}

module.exports = TuneInProvider
