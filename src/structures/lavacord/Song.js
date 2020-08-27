const DataInput = require('../../utils/DataInput')
const Utils = require('../../utils/Utils')

const TRACK_INFO_VERSIONED = 1
const TRACK_INFO_VERSION = 2

class Song {
  constructor (track, info, provider) {
    this.track = track
    this.info = info
    this.provider = provider

    try {
      if (track) {
        const decodedInfo = this.constructor.decodeTrack(track)
        console.log(info, decodedInfo)
        Utils.compareProperties(info, decodedInfo, { ignoreExtraKeys: true })
        this.info = { ...info, ...decodedInfo }
      }
    } catch (e) {
      console.error(`Error parsing track code: ${e}`)
    }
  }

  get title () {
    return this.info.title
  }

  get author () {
    return this.info.author
  }

  get length () {
    return this.info.length
  }

  get identifier () {
    return this.info.identifier
  }

  get stream () {
    return this.info.isStream
  }

  get uri () {
    return this.info.uri
  }

  get isSeekable () {
    return this.info.isSeekable
  }

  get position () {
    return this.info.position
  }

  get source () {
    return this.info.source
  }

  // Methods
  async fetchExtraInfo () {
    switch (this.source) {
      case 'youtube':
        return {} // TODO: YoutubeAPI request
      case 'soundcloud':
        return {} // TODO: SoundcloudAPI request
      default:
        return {}
    }
  }

  getCode () {
    return this.track
  }

  // Static
  static from (track) {
    return new this(track, this.decodeTrack(track))
  }

  static decodeTrack (track) {
    const data = new DataInput(Buffer.from(track, 'base64'))

    const value = data.readInt()
    const messageSize = value & 0x3FFFFFFF
    if (messageSize <= 0) {
      throw new Error('Invalid message size')
    }

    const messageFlags = (value & 0xC0000000) >> 30
    let trackInfoVersion = 1
    if (messageFlags & TRACK_INFO_VERSIONED) { // Checks for TRACK_INFO_VERSIONED flag
      trackInfoVersion = data.read()
      if (trackInfoVersion > TRACK_INFO_VERSION) {
        throw new Error(`Invalid track info, supported track info version: ${TRACK_INFO_VERSION}`)
      }
    }

    return {
      title: data.readUTF(),
      author: data.readUTF(),
      length: data.readLong(),
      identifier: data.readUTF(),
      isStream: data.readBoolean(),
      uri: trackInfoVersion >= 2 ? data.readBoolean() ? data.readUTF() : null : null, // Nullable
      source: data.readUTF(),
      // TODO: Support track factory details (? only local tracks use that)
      position: data.readLong()
    }
  }
}

module.exports = Song
