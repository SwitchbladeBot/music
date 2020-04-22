class Bucket {
    constructor(tokenLimit, interval, options = {}) {
        this.tokenLimit = tokenLimit
        this.interval = interval
        this.latencyRef = options.latencyRef || { latency: 0 }
        this.lastReset = this.tokens = this.lastSend = 0
        this.reservedTokens = options.reservedTokens || 0
        this._queue = []
    }

    queue(func, priority=false) {
        if(priority) {
            this._queue.unshift({func, priority})
        } else {
            this._queue.push({func, priority})
        }
        this.check()
    }

    check() {
        if(this.timeout || this._queue.length === 0) {
            return
        }
        if(this.lastReset + this.interval + this.tokenLimit * this.latencyRef.latency < Date.now()) {
            this.lastReset = Date.now()
            this.tokens = Math.max(0, this.tokens - this.tokenLimit)
        }

        let val;
        const tokensAvailable = this.tokens < this.tokenLimit
        const unreservedTokensAvailable = this.tokens < (this.tokenLimit - this.reservedTokens)
        while(this._queue.length > 0 && (unreservedTokensAvailable || (tokensAvailable && this._queue[0].priority))) {
            this.tokens++
            const item = this._queue.shift()
            val = this.latencyRef.latency - Date.now() + this.lastSend
            if(this.latencyRef.latency === 0 || val <= 0) {
                item.func()
                this.lastSend = Date.now()
            } else {
                setTimeout(() => {
                    item.func()
                }, val)
                this.lastSend = Date.now() + val
            }
        }

        if(this._queue.length > 0 && !this.timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = null
                this.check()
            }, this.tokens < this.tokenLimit ? this.latencyRef.latency : Math.max(0, this.lastReset + this.interval + this.tokenLimit * this.latencyRef.latency - Date.now()))
        }
    }
}

module.exports = Bucket