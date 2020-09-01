const Sentry = require('@sentry/node')
Sentry.init({ dsn: process.env.SENTRY_DSN })

const MusicManager = require('./structures/MusicManager')

const manager = new MusicManager()
manager.connect().then(async () => {
  const song = await manager.songProvider.get('https://www.youtube.com/watch?v=I7HahVwYpwo') // ytsearch:girassol da cor do seu cabelo

  // Deezer
  // https://www.deezer.com/en/track/943605532
  // https://www.deezer.com/en/album/120712382
  // https://www.deezer.com/en/playlist/5715041542

  // Tidal
  // https://www.tidal.com/track/64975224 || https://www.tidal.com/browse/track/64975224
  // https://www.tidal.com/album/80216363 || https://www.tidal.com/browse/album/80216363
  // https://www.tidal.com/playlist/1c5d01ed-4f05-40c4-bd28-0f73099e9648 || https://www.tidal.com/browse/playlist/1c5d01ed-4f05-40c4-bd28-0f73099e9648

  // iHeart
  // https://www.iheart.com/live/5479
  const player = await manager.lavalink.join({
    guild: '445203868624748555',
    channel: '726616602526875689',
    node: '1'
  }, { selfdeaf: true })

  console.log('Connected')
  console.log(song.title)

  if (song) {
    await player.play(song)
    console.log(player.queue.map(s => s.title))
    player.once('error', error => console.error(error))
  }
})
