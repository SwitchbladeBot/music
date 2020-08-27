const SpotifyAPI = require('../../../apis/Spotify')

const SpotifySong = require('./SpotifySong')
const SpotifyPlaylist = require('./SpotifyPlaylist')

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
    return Promise.all([
      this.getTrack,
      this.getAlbum,
      this.getPlaylist
    ]
      .map(f => f(provider, identifier)))
      .then(r => r.find(v => v)) // Find a valid match
  }

  static async getTrack (provider, identifier) {
    const trackResult = TRACK_REGEX.map(r => r.exec(identifier)).find(r => r)
    if (trackResult) {
      const [, id] = trackResult
      const track = await SpotifyAPI.getTrack(id)
      return track ? new SpotifySong(track, provider) : undefined
    }
  }

  static async getAlbum (provider, identifier) {
    const albumResult = ALBUM_REGEX.map(r => r.exec(identifier)).find(r => r)
    if (albumResult) {
      const [, id] = albumResult
      const album = await SpotifyAPI.getAlbum(id)
      if (album) {
        const { items } = await SpotifyAPI.getAlbumTracks(album.id)
        return items ? new SpotifyPlaylist(items, album, provider) : undefined
      }
    }
  }

  static async getPlaylist (provider, identifier) {
    const playlistResult = PLAYLIST_REGEX.map(r => r.exec(identifier)).find(r => r)
    if (playlistResult) {
      const [, id] = playlistResult
      const playlist = await SpotifyAPI.getPlaylist(id)
      if (playlist) {
        const { items } = await SpotifyAPI.getPlaylistTracks(playlist.id)
        return items ? new SpotifyPlaylist(items, playlist, provider) : undefined
      }
    }
  }
}

module.exports = SpotifyProvider
