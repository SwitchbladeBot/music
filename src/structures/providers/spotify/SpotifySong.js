const Song = require('../../lavacord/Song')
const YoutubeMusicAPI = require('../../../apis/YoutubeMusic')

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

  get length () {
    return this.info.length
  }

  get identifier () {
    return this.spotifyTrack.id
  }

  get stream () {
    return super.isStream || false
  }

  get uri () {
    return this.spotifyTrack.external_urls.spotify
  }

  get isSeekable () {
    return typeof super.isSeekable === 'boolean' ? super.isSeekable : true
  }

  get position () {
    return this.info.position || 0
  }

  get source () {
    return 'spotify'
  }

  fetchExtraInfo () {
    return this.spotifyTrack
  }

  async getCode () {
    if (this.trackCode) return this.trackCode
    const video = await YoutubeMusicAPI.getClosestMatch(`${this.author} - ${this.title}`)
    if (video) {
      const { tracks } = await this.provider.loadTracks(video.id, 1)
      if (tracks && tracks.length) {
        const [{ track, info }] = tracks
        this.info = info
        return track
      }
    }
  }
}

module.exports = SpotifySong
