const fetch = require('node-fetch')

const API_URL = 'https://api.deezer.com'

class DeezerAPI {
  static getTrack (id) {
    return this.request(`/track/${id}`)
  }

  static getAlbum (id) {
    return this.request(`/album/${id}`)
  }

  static getArtist (id) {
    return this.request(`/artist/${id}`)
  }

  static getArtistAlbums (id, limit = 10) {
    return this.request(`/artist/${id}/albums`, { limit })
  }

  static getArtistRelated (id) {
    return this.request(`/artist/${id}/related`)
  }

  static getPlaylist (id) {
    return this.request(`/playlist/${id}`)
  }

  static getUserFollowers (id) {
    return this.request(`/user/${id}/followers`)
  }

  static getUserFollowings (id) {
    return this.request(`/user/${id}/followings`)
  }

  static getUserChart (id, chart = 'artists') {
    return this.request(`/user/${id}/charts/${chart}`)
  }

  static getPodcastEpisodes (id) {
    return this.request(`/podcast/${id}/episodes`)
  }

  // Search
  static findTracks (q) {
    return this.request('/search', { q })
  }

  static findAlbums (q) {
    return this.request('/search/album', { q })
  }

  static findArtists (q) {
    return this.request('/search/artist', { q })
  }

  static findPlaylists (q) {
    return this.request('/search/playlist', { q })
  }

  static findPodcasts (q) {
    return this.request('/search/podcast', { q })
  }

  static findUser (q) {
    return this.request('/search/user', { q })
  }

  // Default
  static request (endpoint, queryParams = {}) {
    const qParams = new URLSearchParams(queryParams)
    return fetch(API_URL + endpoint + `?${qParams.toString()}`)
      .then(res => res.json())
  }
}

module.exports = DeezerAPI
