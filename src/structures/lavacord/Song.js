const DataInput = require('../../utils/DataInput')

const TRACK_INFO_VERSION = 2

class Song {
  constructor (track, info) {
    this.track = track
    this.info = info

    const decodedInfo = this.constructor.decodeTrack(track)
    this.decodedInfo = decodedInfo // WIP
    // TODO: Compare and merge decodedInfo and info
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

  // Static
  static from (track) {
    return new this(track, this.decodeTrack(track))
  }

  static decodeTrack (track) {
    const data = new DataInput(Buffer.from(track, 'base64'))

    const messageFlag = data.readInt()
    const realMessageLength = data.length - 4 // Total length - 4 (bytes read in the readInt() method)
    if ((realMessageLength | 1 << 30) === messageFlag) { // Checks for TRACK_INFO_VERSIONED flag
      const trackInfoVersion = data.read()
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
      uri: data.readBoolean() ? data.readUTF() : null, // Nullable
      source: data.readUTF(),
      // TODO: Support track factory details (? only local tracks use that)
      position: data.readLong()
    }
  }
}

module.exports = Song
