const Sentry = require('@sentry/node')
Sentry.init({ dsn: process.env.SENTRY_DSN })

const MusicManager = require('./structures/MusicManager')

const manager = new MusicManager()
manager.connect().then(async () => {
  const song = await manager.songProvider.get('https://open.spotify.com/track/1JYZf5oWWfEVLpl7HjMGiz?si=nl_uSrFHTCKwesCQQhQXpw') // ytsearch:girassol da cor do seu cabelo
  const player = await manager.lavalink.join({
    guild: '445203868624748555',
    channel: '701928171519344801',
    node: '1'
  }, { selfdeaf: true })

  // console.log(song)

  await player.play(song)
  player.once('error', error => console.error(error))
})
