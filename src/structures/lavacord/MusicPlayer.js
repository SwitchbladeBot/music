const { Player } = require('lavacord')

class MusicPlayer extends Player {
    constructor (node, id) {
        super (node, id)

        this.song = null

        this.volume = 25
        this.paused = false
        this.looping = false

        this.previousVolume = null
        this.bassboost = false

        this.queue = []

        this.registerListeners()
    }

    play (song, forcePlay = false) {
        if (this.playing && !forcePlay) {
            this.queueSong(song)
            return false
        }

        this.song = song
        super.play(song.track, { volume: this.volume })
        return true
    }

    queueSong (song) {
        this.queue.push(song)
    }

    next () {
        if (this.looping) this.queueSong(this.playingSong)

        const next = this.queue.shift()
        if (next) {
            this.play(next, true)
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
