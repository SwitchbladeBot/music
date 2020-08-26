const Song = require('../../lavacord/Song')

class SpotifySong extends Song {
  constructor (code, info, spotifyTrack, youtubeVideo) {
    super(code, info)

    this.spotifyTrack = spotifyTrack
    this.youtubeVideo = youtubeVideo
  }

  get title () {
    return this.spotifyTrack.name
  }

  get author () {
    return this.spotifyTrack.artists.join(', ')
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
}

module.exports = SpotifySong
