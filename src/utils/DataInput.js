class DataInput {
  constructor (buffer) {
    this.buffer = buffer
    this.offset = 0
  }

  get length () {
    return this.buffer.length
  }

  read (len = 1, parseBytes = false) {
    const bytes = [...this.buffer.slice(this.offset, this.offset + len).values()]
    this.offset += len
    return len === 1 ? bytes[0] : parseBytes ? bytes.reduce((acc, x, i) => ((x & 0xff) << (8 * (len - 1) - 8 * i)) | acc, 0) : bytes
  }

  readInt () {
    return this.read(4, true)
  }

  readBoolean () {
    return !!this.read() // 1 = true, 0 = false
  }

  readUTF () {
    const length = this.readUnsignedShort() // 2 bytes
    let i = 0
    let string = ""
    while (i < length) {
      const a = this.read()
      if (a > 192) {
        const b = this.read()
        if (a > 224) {
          const c = this.read()
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
    return string
  }

  readLong () {
    return this.read(8, true)
  }

  readUnsignedShort () {
    return this.read(2, true)
  }
}

module.exports = DataInput
