const fetch = require('node-fetch')

const API_URL = 'https://opml.radiotime.com'

class TuneInAPI {
  static get (id) {
    return this.request('/Tune.ashx', { id }).then(({ body: [ result ]}) => result)
  }

  // Internal
  static async request (endpoint, queryParams = {}) {
    const qParams = new URLSearchParams({ ...queryParams, render: 'json', formats: 'mp3,aac,ogg,flash,html,hls' })
    return fetch(API_URL + endpoint + `?${qParams.toString()}`, {
      headers: { Accept: 'application/json' }
    }).then(res => res.json())
  }
}

module.exports = TuneInAPI
