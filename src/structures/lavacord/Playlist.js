class Playlist {
  constructor (tracks, info, provider) {
    this.tracks = tracks
    this.info = info
    this.provider = provider
  }

  get length () {
    return this.tracks.reduce((a, b) => a + b.length, 0)
  }

  get source () {
    return this.tracks[0].source
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
}

module.exports = Playlist
