const fetch = require('node-fetch')

const API_URL = 'https://www.googleapis.com/youtube/v3'

class YoutubeAPI {
  static getVideos (ids, part = 'snippet,statistics') {
    return this.request('/videos', { part, id: ids.join(',') }).then(r => r && r.items)
  }

  static getVideo (id, part = 'snippet,statistics') {
    return this.request('/videos', { part, id }).then(r => r && r.items[0])
  }

  static getChannels (ids, part = 'snippet,statistics') {
    return this.request('/channels', { part, id: ids.join(',') }).then(r => r && r.items)
  }

  static getChannel (id, part = 'snippet,statistics') {
    return this.request('/channels', { part, id }).then(r => r && r.items[0])
  }

  static getPlaylist (id, part = 'snippet') {
    return this.request('/playlists', { part, id }).then(r => r && r.items[0])
  }

  // Search
  static searchVideos (query, part = 'snippet', maxResults = 5) {
    return this.search(query, ['video'], part, 'relevance', maxResults)
  }

  static search (query, type = ['video', 'channel', 'playlist'], part = 'snippet', order = 'relevance', maxResults = 5) {
    return this.request('/search', { q: query, type: type.join(), part, order, maxResults })
  }

  // Utilities
  static async getClosestMatch (title) {
    const { regionCode, items } = await this.searchVideos(title, undefined, 3)
    const videos = await this.getVideos(items.map(v => v.id.videoId), 'contentDetails')
    // TODO: String similarity check (between video title and title provided) to prevent false-positive matches
    return videos.find(v => (
      !v.contentDetails.regionRestriction ||
      !v.contentDetails.regionRestriction.blocked.includes(regionCode) ||
      !v.contentDetails.regionRestriction.allowed.includes(regionCode)))
  }

  static getBestThumbnail (thumbnails) {
    if (!thumbnails) return {}
    return ['maxres', 'high', 'medium', 'standard', 'default'].find(q => thumbnails[q])
  }

  // Internal
  static async request (endpoint, queryParams = {}) {
    const qParams = new URLSearchParams({ ...queryParams, key: process.env.YOUTUBE_API_KEY })
    return fetch(API_URL + endpoint + `?${qParams.toString()}`, {
      headers: { Accept: 'application/json' }
    }).then(res => res.json())
  }
}

module.exports = YoutubeAPI
