const fetch = require('node-fetch')

const API_URL = 'https://api.tidal.com/v1'

const MAIN_SCRIPT_REGEX = /<script src="(\/app.+)"/
const SCRIPT_TOKEN_REGEX = /enableDesktopFeatures\?"[A-Za-z0-9]+":"([A-Za-z0-9]+)",/

class TidalAPI {
  // Search
  static search (query, type = 'tracks') {
    return this.request(`/search/${type}`, { query })
  }

  // Getters
  static getTrack (id) {
    return this.request(`/tracks/${id}`)
  }

  static getAlbum (id) {
    return this.request(`/albums/${id}`)
  }

  static getAlbumTracks (id) {
    return this.request(`/albums/${id}/tracks`)
  }

  static getPlaylist (uuid) {
    return this.request(`/playlists/${uuid}`)
  }

  static getPlaylistTracks (uuid) {
    return this.request(`/playlists/${uuid}/tracks`)
  }

  // Default
  static async request (endpoint, queryParams = {}) {
    const qParams = new URLSearchParams({ ...queryParams, countryCode: 'US', limit: 100 })
    return fetch(API_URL + endpoint + `?${qParams.toString()}`, {
      headers: { 'x-tidal-token': await this.fetchToken() }
    }).then(res => res.json())
  }

  static async fetchToken () {
    if (this.token) return this.token

    const mainPage = await fetch('https://listen.tidal.com/').then(r => r.text())
    const [, scriptPath] = MAIN_SCRIPT_REGEX.exec(mainPage)
    const scriptPage = await fetch('https://listen.tidal.com' + scriptPath).then(r => r.text())
    const [, token] = SCRIPT_TOKEN_REGEX.exec(scriptPage)

    this.token = token
    return token
  }
}

module.exports = TidalAPI
