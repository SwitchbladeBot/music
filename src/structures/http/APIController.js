const express = require('express')
const cors = require('cors')

class APIController {
  constructor (manager) {
    this.manager = manager
    this.app = express()
    this.app.use(cors())
  }

  start (port) {
    return this.createRoutes(this.app).then(() => this.listen(port))
  }

  async createRoutes (app) {
    // TODO: Auth
    app.get('/search', async (req, res) => {
      const { identifier, guildId, channelId } = req.query
      if (!identifier) {
        return res.status(400).send({ error: 'Missing "identifier" query parameter.' })
      }

      const song = await this.manager.songProvider.get(identifier)
      // TODO: Parse songs
      if (song) {
        if (!guildId) {
          return res.status(400).send({ error: 'Missing "guildId" query parameter.' })
        }
        let player = this.manager.lavalink.players.get(guildId)
        if (!player) {
          if (!channelId) {
            return res.status(400).send({ error: 'Missing "channelId" query parameter.' })
          }
          player = await this.manager.lavalink.join({
            guild: guildId,
            channel: channelId,
            node: '1' // TODO: Choose best node
          }, { selfdeaf: true }) // TODO: Default options?
        }

        player.play(song)
        return res.send(song.asJSON())
      }
      return res.status(404).send({ error: 'nao achei nada meu patrão' })
    })

    app.get('/playing', async (req, res) => {
      const { guildId } = req.query
      if (!guildId) {
        return res.status(400).send({ error: 'Missing "guildId" query parameter.' })
      }

      const player = this.manager.lavalink.players.get(guildId)
      const song = player && player.song
      res.send(song ? song.asJSON() : {})
    })

    app.get('/play', async (req, res) => {
      const { guildId, channelId, track } = req.query
      if (!guildId) {
        return res.status(400).send({ error: 'Missing "guildId" query parameter.' })
      }
      if (!track) {
        return res.status(400).send({ error: 'Missing "track" query parameter.' })
      }

      let player = this.manager.lavalink.players.get(guildId)
      if (!player) {
        if (!channelId) {
          return res.status(400).send({ error: 'Missing "channelId" query parameter.' })
        }
        player = await this.manager.lavalink.join({
          guild: guildId,
          channel: channelId,
          node: '1' // TODO: Choose best node
        }, { selfdeaf: true }) // TODO: Default options?
      }

      // const song =
      // await player.play(song)

      res.send()
    })

    app.get('/skip', async (req, res) => {
      const { guildId } = req.query
      if (!guildId) {
        return res.status(400).send({ error: 'Missing "guildId" query parameter.' })
      }

      const player = this.manager.lavalink.players.get(guildId)
      if (!player || !player.playing) {
        return res.status(400).send({ error: 'n to tocano porra' })
      }

      const song = player.next()

      res.send({ ok: true, song: song ? song.asJSON() : null })
    })

    app.get('/queue', async (req, res) => {
      const { guildId } = req.query
      if (!guildId) {
        return res.status(400).send({ error: 'Missing "guildId" query parameter.' })
      }

      const player = this.manager.lavalink.players.get(guildId)
      if (!player || !player.playing) {
        return res.status(400).send({ error: 'n to tocano porra' })
      }

      res.send({ playing: player.song.asJSON(), queue: player.queue })
    })

    app.get('/volume', async (req, res) => {
      const { guildId, volume } = req.query
      if (!guildId) {
        return res.status(400).send({ error: 'Missing "guildId" query parameter.' })
      }

      const player = this.manager.lavalink.players.get(guildId)
      if (!player || !player.playing) {
        return res.status(400).send({ error: 'n to tocano porra' })
      }

      const nVolume = parseInt(volume)
      if (isNaN(nVolume)) {
        return res.status(400).send({ error: 'Missing "volume" query parameter.' })
      }

      player.volume(nVolume)

      res.send({ ok: true, volume })
    })
  }

  listen (port) {
    return new Promise(resolve => this.app.listen(port, resolve))
  }
}

module.exports = APIController
