class DataInput {
  constructor (buffer) {
    this.buffer = buffer
    this.offset = 0
  }

  get length () {
    return this.buffer.length
  }

  read () {
    const value = this.buffer[this.offset]
    this.offset++ // 1 byte
    return value
  }

  readInt () {
    const value = this.buffer.readInt32BE(this.offset) // 32 bits = 4 bytes
    this.offset += 4 // 4 bytes
    return value
  }

  readBoolean () {
    return !!this.read() // 1 = true, 0 = false
  }

  readUTF () {
    const length = this.readUnsignedShort() // 2 bytes
    let i = 0
    let string = ""
    while (i < length) {
      const a = this.buffer[this.offset + i]
      if (a > 192) {
        const b = this.buffer[this.offset + i + 1]
        if (a > 224) {
          const c = this.buffer[this.offset + i + 2]
          string += String.fromCodePoint(((a & 0x0F) << 12) | ((b & 0x3F) << 6) | (c & 0x3F)) // 3 bytes char
          i += 3
        } else {
            string += String.fromCodePoint(((a & 0x1F) << 6) | (b & 0x3F)) // 2 bytes char
          i += 2
        }
      } else {
        string += String.fromCodePoint(a) // 1 byte char
        i++
      }
    }
    this.offset += length // 2 bytes + length (variable) bytes
    return string
  }

  readLong () {
    const [ a, b, c, d, e, f, g, h ] = this.buffer.slice(this.offset, this.offset + 8)
    this.offset += 8 // 8 bytes
    return (((a & 0xff) << 56) |
      ((b & 0xff) << 48) |
      ((c & 0xff) << 40) |
      ((d & 0xff) << 32) |
      ((e & 0xff) << 24) |
      ((f & 0xff) << 16) |
      ((g & 0xff) <<  8) |
      ((h & 0xff)))
  }

  readUnsignedShort () {
    const a = this.buffer[this.offset]
    const b = this.buffer[this.offset + 1]
    this.offset += 2 // 2 bytes
    return ((a & 0xff) << 8) | (b & 0xff)
  }
}

module.exports = DataInput
