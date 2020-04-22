const Shard = require("./Shard")

class ShardManager {
    constructor(client) {
        this._client = client;

        this.connectQueue = [];
        this.lastConnect = 0;
        this.connectTimeout = null;
        this.shards = new Map()
    }

    // Collection
    get (id) {
        return this.shards.get(id)
    }

    find(func) {
        for(const item of this.shards.values()) {
            if(func(item)) {
                return item
            }
        }
        return undefined
    }

    get size () {
        return this.shards.size
    }

    // ShardManager
    _readyPacketCB() {
        this.lastConnect = Date.now()
        this.tryConnect()
    }

    connect(shard) {
        if(shard.sessionID || (this.lastConnect <= Date.now() - 5000 && !this.find((shard) => shard.connecting))) {
            shard.connect()
            this.lastConnect = Date.now() + 7500
        } else {
            this.connectQueue.push(shard)
            this.tryConnect()
        }
    }

    tryConnect() {
        if(this.connectQueue.length > 0) {
            if(this.lastConnect <= Date.now() - 5000) {
                const shard = this.connectQueue.shift()
                shard.connect()
                this.lastConnect = Date.now() + 7500
            } else if(!this.connectTimeout) {
                this.connectTimeout = setTimeout(() => {
                    this.connectTimeout = null
                    this.tryConnect()
                }, 1000)
            }
        }
    }

    spawn(id) {
        let shard = this.shards.get(id)
        if(!shard) {
            shard = new Shard(id, this._client)
            this.shards.set(id, shard)
            shard.on("ready", () => {
                this._client.emit("shardReady", shard.id)
                if(this._client.ready) {
                    return
                }
                for(const other of this.shards.values()) {
                    if(!other.ready) {
                        return
                    }
                }
                this._client.ready = true
                this._client.startTime = Date.now()
                this._client.emit("ready")
            }).on("resume", () => {
                this._client.emit("shardResume", shard.id)
                if(this._client.ready) {
                    return;
                }
                for(const other of this.shards.values()) {
                    if(!other.ready) {
                        return
                    }
                }
                this._client.ready = true
                this._client.startTime = Date.now()
                this._client.emit("ready")
            }).on("disconnect", (error) => {
                this._client.emit("shardDisconnect", error, shard.id)
                for(const other of this.shards.values()) {
                    if(other.ready) {
                        return
                    }
                }
                this._client.ready = false
                this._client.startTime = 0
                this._client.emit("disconnect")
            });
        }
        if(shard.status === "disconnected") {
            this.connect(shard)
        }
    }

    toString() {
        return `[ShardManager ${this.shards.size}]`
    }

    toJSON(props = []) {
        return super.toJSON([
            "connectQueue",
            "lastConnect",
            "connectionTimeout",
            ...props
        ])
    }
}

module.exports = ShardManager