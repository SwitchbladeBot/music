const { Player } = require('lavacord')

const Song = require('./Song')
const Playlist = require('./Playlist')

class MusicPlayer extends Player {
  constructor (node, id) {
    super(node, id)

    this.song = null

    this._volume = 10
    this.paused = false
    this.looping = false

    this.previousVolume = null
    this.bassboost = false

    this.queue = []

    this.registerListeners()
  }

  async play (audio) {
    if (audio instanceof Playlist) {
      for (const song of audio.tracks) {
        await this._play(song)
      }
    } else if (audio instanceof Song) {
      this._play(audio)
    } else {
      throw new Error('Invalid audio track')
    }
  }

  async _play (song, forcePlay = false) {
    if (this.playing && !forcePlay) {
      this.queueSong(song)
      return false
    }

    const songCode = await song.getCode()
    // console.log(songCode)
    if (songCode) {
      this.song = song
      await super.play(songCode, { volume: this._volume })
      return true
    } else {
      return this.next()
    }
  }

  queueSong (song) {
    this.queue.push(song)
  }

  next () {
    if (this.looping) this.queueSong(this.playingSong)

    const next = this.queue.shift()
    if (next) {
      this._play(next, true)
      return next
    }
    super.stop()
  }

  registerListeners () {
    this.on('end', ({ reason }) => {
      if (reason !== 'STOPPED') {
        if (reason === 'REPLACED') return
        this.next()
      }
    })

    this.on('stop', () => {
      this.song = null
      this.destroy()
    })
  }
}

module.exports = MusicPlayer
