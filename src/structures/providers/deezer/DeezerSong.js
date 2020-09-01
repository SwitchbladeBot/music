const Song = require('../../lavacord/Song')
const YoutubeMusicAPI = require('../../../apis/YoutubeMusic')

class DeezerSong extends Song {
  constructor (deezerTrack, provider) {
    super(null, null, provider)

    this.deezerTrack = deezerTrack
  }

  get title () {
    return this.deezerTrack.title
  }

  get author () {
    console.log
    return this.deezerTrack.artist.name
  }

  get length () {
    return super.length || this.deezerTrack.duration * 1000
  }

  get identifier () {
    return this.deezerTrack.id
  }

  get stream () {
    return super.isStream || false
  }

  get uri () {
    return this.deezerTrack.link
  }

  get isSeekable () {
    return typeof super.isSeekable === 'boolean' ? super.isSeekable : true
  }

  get position () {
    return this.info.position || 0
  }

  get source () {
    return 'deezer'
  }

  fetchExtraInfo () {
    return this.deezerTrack
  }

  async getCode () {
    if (this.trackCode) return this.trackCode
    const video = await YoutubeMusicAPI.getClosestMatch(`${this.author} - ${this.title}`)
    if (video) {
      const { tracks } = await this.provider.loadTracks(video.id, 1)
      if (tracks && tracks.length) {
        const [{ track, info }] = tracks
        this.info = info
        console.log(info.identifier)
        return track
      }
    }
  }
}

module.exports = DeezerSong
