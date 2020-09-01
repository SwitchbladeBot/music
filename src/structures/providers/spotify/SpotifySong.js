const Song = require('../../lavacord/Song')

class SpotifySong extends Song {
  constructor (spotifyTrack, provider) {
    super(null, null, provider)

    this.spotifyTrack = spotifyTrack
  }

  get title () {
    return this.spotifyTrack.name
  }

  get author () {
    return this.spotifyTrack.artists.map(a => a.name).join(', ')
  }

  get identifier () {
    return this.spotifyTrack.id
  }

  get uri () {
    return this.spotifyTrack.external_urls.spotify
  }

  get source () {
    return 'spotify'
  }

  fetchExtraInfo () {
    return this.spotifyTrack
  }
}

module.exports = SpotifySong
