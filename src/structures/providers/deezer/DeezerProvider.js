const DeezerAPI = require('../../../apis/Deezer')

const DeezerSong = require('./DeezerSong')
const DeezerPlaylist = require('./DeezerPlaylist')

const TRACK_REGEX = /^(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?track\/(\d+)/
const ALBUM_REGEX = /^(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?album\/(\d+)/
const PLAYLIST_REGEX = /^(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?playlist\/(\d+)/

class DeezerProvider {
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
    const trackResult = TRACK_REGEX.exec(identifier)
    if (trackResult) {
      const [, id] = trackResult
      const track = await DeezerAPI.getTrack(id)
      console.log(track)
      return track ? new DeezerSong(track, provider) : undefined
    }
  }

  static async getAlbum (provider, identifier) {
    const albumResult = ALBUM_REGEX.exec(identifier)
    if (albumResult) {
      const [, id] = albumResult
      const album = await DeezerAPI.getAlbum(id)
      console.log(album)
      if (album) {
        const { tracks: { data } } = await album
        return data ? new DeezerPlaylist(data, album, provider) : undefined
      }
    }
  }

  static async getPlaylist (provider, identifier) {
    const playlistResult = PLAYLIST_REGEX.exec(identifier)
    if (playlistResult) {
      const [, id] = playlistResult
      const playlist = await DeezerAPI.getPlaylist(id)
      console.log(playlist)
      if (playlist) {
        const { tracks: { data } } = await playlist
        return data ? new DeezerPlaylist(data, playlist, provider) : undefined
      }
    }
  }
}

module.exports = DeezerProvider
