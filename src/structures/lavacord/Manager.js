const { Manager: LavacordManager } = require('lavacord')

module.exports = class Manager extends LavacordManager {
    constructor (client, nodes, options) {
        super(nodes, options || {})

        this.client = client
        this.user = client.userId
        this.send = packet => {
            const id = this.client.guildShardMap[packet.d.guild_id]
            const shard = this.client.shards.get(id)
            if (shard) return shard.sendWS(packet.op, packet.d)
        }

        client
            .once('ready', () => {
                this.shards = client.shards.size || 1
            })
            .on('rawWS', async (packet) => {
                switch (packet.t) {
                    case 'VOICE_SERVER_UPDATE':
                        await this.voiceServerUpdate(packet.d)
                        break
                    case 'VOICE_STATE_UPDATE':
                        await this.voiceStateUpdate(packet.d)
                        break
                    case 'GUILD_CREATE':
                        for (const state of packet.d.voice_states) await this.voiceStateUpdate({ ...state, guild_id: packet.d.id })
                        break
                }
            })
    }
}