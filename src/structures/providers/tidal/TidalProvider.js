const TidalAPI = require('../../../apis/Tidal')

const TidalSong = require('./TidalSong')
const TidalPlaylist = require('./TidalPlaylist')

const TRACK_REGEX = /^(?:https?:\/\/|)?(?:www\.)?tidal\.com\/(?:browse\/)?track\/(\d+)/
const ALBUM_REGEX = /^(?:https?:\/\/|)?(?:www\.)?tidal\.com\/(?:browse\/)?album\/(\d+)/
const PLAYLIST_REGEX = /^(?:https?:\/\/|)?(?:www\.)?tidal\.com\/(?:browse\/)?playlist\/([A-Za-z0-9-]+)/

class TidalProvider {
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
      const track = await TidalAPI.getTrack(id)
      return track ? new TidalSong(track, provider) : undefined
    }
  }

  static async getAlbum (provider, identifier) {
    const albumResult = ALBUM_REGEX.exec(identifier)
    if (albumResult) {
      const [, id] = albumResult
      const album = await TidalAPI.getAlbum(id)
      if (album) {
        const { items } = await TidalAPI.getAlbumTracks(album.id)
        return items ? new TidalPlaylist(items, album, provider) : undefined
      }
    }
  }

  static async getPlaylist (provider, identifier) {
    const playlistResult = PLAYLIST_REGEX.exec(identifier)
    if (playlistResult) {
      const [, uuid] = playlistResult
      const playlist = await TidalAPI.getPlaylist(uuid)
      if (playlist) {
        const { items } = await TidalAPI.getPlaylistTracks(playlist.uuid)
        return items ? new TidalPlaylist(items, playlist, provider) : undefined
      }
    }
  }
}

module.exports = TidalProvider
