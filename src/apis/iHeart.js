const fetch = require('node-fetch')

const API_URL = 'https://api.iheart.com/api/v2'

class iHeartAPI {
  static getStation (id) {
    return this.request('/content/liveStations', { id }).then(({ hits }) => hits ? hits[0] : null)
  }

  // Search
  static searchStation (q) {
    return this.request('/content/liveStations', { q })
  }

  // Default
  static request (endpoint, queryParams = {}) {
    const qParams = new URLSearchParams(queryParams)
    return fetch(API_URL + endpoint + `?${qParams.toString()}`)
      .then(res => res.json())
  }
}

module.exports = iHeartAPI
