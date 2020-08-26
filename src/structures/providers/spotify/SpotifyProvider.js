const SpotifyAPI = require('../../../apis/Spotify')
const YoutubeAPI = require('../../../apis/Youtube')

const SpotifySong = require('./SpotifySong')

const TRACK_REGEX = [
  /^(?:https?:\/\/|)?(?:www\.)?open\.spotify\.com\/track\/([a-zA-Z\d-_]+)/,
  /spotify:track:([a-zA-Z\d-_]+)$/
]
const ALBUM_REGEX = [
  /^(?:https?:\/\/|)?(?:www\.)?open\.spotify\.com\/album\/([a-zA-Z\d-_]+)/,
  /spotify:album:([a-zA-Z\d-_]+)$/
]
const PLAYLIST_REGEX = [
  /^(?:https?:\/\/|)?(?:www\.)?open\.spotify\.com(?:\/user\/[a-zA-Z\d-_]+)?\/playlist\/([a-zA-Z\d-_]+)/,
  /^spotify(?::user:[a-zA-Z\d-_]+)?:playlist:([a-zA-Z\d-_]+)$/
]

class SpotifyProvider {
  static get (provider, identifier) {
    return Promise.all([this.getTrack, this.getAlbum, this.getPlaylist].map(f => f(provider, identifier))).then(r => r.find(v => v))
  }

  static async getTrack (provider, identifier) {
    const trackResult = TRACK_REGEX.map(r => r.exec(identifier)).find(r => r)
    if (trackResult) {
      const [, id] = trackResult
      const track = await SpotifyAPI.getTrack(id)
      return track ? SpotifyProvider.fetchTrack(provider, track) : undefined
    }
  }

  static async getAlbum (provider, identifier) {
    const albumResult = ALBUM_REGEX.map(r => r.exec(identifier)).find(r => r)
    if (albumResult) {
      const [, id] = albumResult
      const album = await SpotifyAPI.getAlbum(id)
      if (album) {

      }
    }
  }

  static async getPlaylist (provider, identifier) {
    const playlistResult = PLAYLIST_REGEX.map(r => r.exec(identifier)).find(r => r)
    if (playlistResult) {

    }
  }

  static async fetchTrack (provider, track) {
    const video = await YoutubeAPI.getClosestMatch(`${track.artists.map(a => a.name).join(', ')} - ${track.name}`)
    if (video) {
      const [song] = await provider.loadTracks(video.id, 1, (code, info) => new SpotifySong(code, info, track, video))
      return song
    }
  }
}

module.exports = SpotifyProvider
