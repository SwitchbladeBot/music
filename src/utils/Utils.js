module.exports = {
  compareProperties (a, b, options = {}) {
    const comparedKeys = []
    for (let [ key, value ] of Object.entries(a)) {
      const valueB = b[key]
      if (options.ignoreExtraKeys && (typeof value === 'undefined' || typeof valueB === 'undefined')) continue
      this.compare(value, valueB, key)
      comparedKeys.push(key)
    }

    if (!options.ignoreExtraKeys) {
      for (let [ keyB, valueB] of Object.entries(b)) {
        if (comparedKeys.includes(keyB)) continue
        const valueA = a[keyB]
        this.compare(value, valueB, keyB)
        comparedKeys.push(key)
      }
    }
  },

  compare (a, b, key) {
    if (a !== b) {
      throw new Error(`"${key}" values should be equal`)
    }
    // TODO: Compare array, objects, etc. (currently it doesn't matter)
  }
}
