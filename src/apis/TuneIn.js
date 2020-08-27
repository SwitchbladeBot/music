const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')

const API_URL = 'https://opml.radiotime.com'
const TUNEIN_URL = 'https://tunein.com/radio/'

class TuneInAPI {
  static get (id) {
    return this.request('/Tune.ashx', { id }).then(({ body: [result] }) => result)
  }

  static async fetch (path, code) {
    const res = await fetch(TUNEIN_URL + path).then(res => res.text())
    const $ = cheerio.load(res)
    const scriptContent = $('#initialStateEl').get([0]).children[0].data.trim()
    const json = JSON.parse(scriptContent.replace('window.INITIAL_STATE=', '').replace(/;$/, ''))
    const { title, description, actions: { share: { shareUrl: shortUrl, logoUrl: image } } } = json.profiles[code]
    return { title, description, image, shortUrl }
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
