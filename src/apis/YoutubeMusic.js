const fetch = require('node-fetch')

const API_URL = 'https://music.youtube.com/youtubei/v1'

const HARDCODED_KEYS = ['AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30', '67', '0.1']

const SEARCH_TYPES = {
  music: 'Eg-KAQwIARAAGAAgACgAMABqChAEEAUQAxAKEAk%3D',
  video: 'Eg-KAQwIABABGAAgACgAMABqChAEEAUQAxAKEAk%3D',
  album: 'Eg-KAQwIABAAGAEgACgAMABqChAEEAUQAxAKEAk%3D',
  playlist: 'Eg-KAQwIABAAGAAgACgBMABqChAEEAUQAxAKEAk%3D',
  artist: 'Eg-KAQwIABAAGAAgASgAMABqChAEEAUQAxAKEAk%3D'
}

class YoutubeMusicAPI {
  // Search
  static async search (query, type = 'music') {
    await this.getKeys()
    const payload = {
      context: {
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: this.keys[2],
          hl: 'en',
          gl: 'GB',
          experimentIds: [],
          experimentsToken: '',
          utcOffsetMinutes: 0,
          locationInfo: {},
          musicAppInfo: {}
        },
        capabilities: {},
        request: {
          internalExperimentFlags: [],
          sessionIndex: {}
        },
        activePlayers: {},
        user: {
          enableSafetyMode: false
        }
      },
      query,
      params: SEARCH_TYPES[type] || null
    }
    const res = await this.request('/search', payload)
    if (res.error) throw new Error(res.error)
    const {
      contents: {
        sectionListRenderer: {
          contents
        }
      }
    } = res
    const {
      musicShelfRenderer: {
        contents: [{
          musicResponsiveListItemRenderer: {
            doubleTapCommand: {
              watchEndpoint: {
                videoId
              }
            }
          }
        }]
      }
    } = contents.find(c => c.musicShelfRenderer)
    return { id: videoId }
  }

  // Utilities
  static async getClosestMatch (title) {
    return this.search(title)
  }

  // Internal
  static async request (endpoint, body) {
    const [key, name, version] = await this.getKeys()
    const qParams = new URLSearchParams({ key, alt: 'json' })
    return fetch(API_URL + endpoint + `?${qParams.toString()}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'X-YouTube-Client-Name': name,
        'X-YouTube-Client-Version': version,
        Origin: 'https://music.youtube.com',
        Referer: 'music.youtube.com',
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
  }

  static async getKeys () {
    if (this.keys && this.keys.length === 3) return this.keys
    if (await this.checkHardcodedKeys()) return HARDCODED_KEYS

    const body = await fetch('https://music.youtube.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36'
      }
    }).then(res => res.text())

    const [, key] = /INNERTUBE_API_KEY":"([0-9a-zA-Z_-]+?)"/ig.exec(body)
    const [, clientName] = /INNERTUBE_CONTEXT_CLIENT_NAME":([0-9]+?),/ig.exec(body)
    const [, clientVersion] = /INNERTUBE_CONTEXT_CLIENT_VERSION":"([0-9\\.]+?)"/ig.exec(body) || /INNERTUBE_CONTEXT_CLIENT_VERSION":"([0-9.]+?)"/ig.exec(body)

    this.keys = [key, clientName, clientVersion]
    return this.keys
  }

  static async checkHardcodedKeys () {
    this.keys = HARDCODED_KEYS
    try {
      await this.search('teste')
      return true
    } catch (e) {
      delete this.keys
      return false
    }
  }
}

module.exports = YoutubeMusicAPI
