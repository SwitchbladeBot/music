module.exports = {
  compareProperties (a, b, options = {}) {
    const comparedKeys = []
    for (const [key, value] of Object.entries(a)) {
      const valueB = b[key]
      if (options.ignoreExtraKeys && (typeof value === 'undefined' || typeof valueB === 'undefined')) continue
      this.compare(value, valueB, key)
      comparedKeys.push(key)
    }

    if (!options.ignoreExtraKeys) {
      for (const [keyB, valueB] of Object.entries(b)) {
        if (comparedKeys.includes(keyB)) continue
        const valueA = a[keyB]
        this.compare(valueA, valueB, keyB)
        comparedKeys.push(keyB)
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
