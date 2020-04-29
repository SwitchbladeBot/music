const b = 'QAAAgwIAI01laWFVbSAtIG9mIGNvdXJzZSBpIHN0aWxsIGxvdmUgeW91AAZNZWlhVW0AAAAAAAbd0AALZGpHdTJHNV9NS00AAQAraHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kakd1Mkc1X01LTQAHeW91dHViZQAAAAAAAAAA'
class Song {
  constructor (track, info) {
    this.track = track
    this.info = info
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
    const info = {}

    const buf = Buffer.from(b, 'base64')
    console.log(buf[0] & 0xFF)
    console.log(buf.indexOf('MeiaUm'))
    // title = 7

    // TODO: Decode track
    return info
  }
}

Song.decodeTrack(b)

module.exports = Song
