const SpotifyProvider = require('./spotify/SpotifyProvider')
const DeezerProvider = require('./deezer/DeezerProvider')
const TidalProvider = require('./tidal/TidalProvider')
const TuneInProvider = require('./tunein/TuneInProvider')

module.exports = [
  SpotifyProvider,
  DeezerProvider,
  TidalProvider,
  TuneInProvider
]
