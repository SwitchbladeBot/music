module.exports.GatewayOPCodes = {
    EVENT:              0,
    HEARTBEAT:          1,
    IDENTIFY:           2,
    STATUS_UPDATE:      3,
    VOICE_STATE_UPDATE: 4,
    VOICE_SERVER_PING:  5,
    RESUME:             6,
    RECONNECT:          7,
    GET_GUILD_MEMBERS:  8,
    INVALID_SESSION:    9,
    HELLO:             10,
    HEARTBEAT_ACK:     11,
    SYNC_GUILD:        12,
    SYNC_CALL:         13
}

module.exports.GATEWAY_VERSION = 6

module.exports.Intents = {
    guilds:                 1 << 0,
    guildMembers:           1 << 1,
    guildBans:              1 << 2,
    guildEmojis:            1 << 3,
    guildIntegrations:      1 << 4,
    guildWebhooks:          1 << 5,
    guildInvites:           1 << 6,
    guildVoiceStates:       1 << 7,
    guildPresences:         1 << 8,
    guildMessages:          1 << 9,
    guildMessageReactions:  1 << 10,
    guildMessageTyping:     1 << 11,
    directMessages:         1 << 12,
    directMessageReactions: 1 << 13,
    directMessageTyping:    1 << 14
}

const REST_VERSION = 7
module.exports.REST_VERSION = REST_VERSION
module.exports.REST_BASE_URL = '/api/v' + REST_VERSION

module.exports.Endpoints = {
    GATEWAY: '/gateway',
    GATEWAY_BOT: '/gateway/bot'
}
