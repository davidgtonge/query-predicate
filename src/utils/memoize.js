const {curryN} = require("ramda")

function pathGet(map, path) {
  let result = map

  for (let i = 0; i < path.length; i += 1) {
    result = result.get(path[i])
    if (!result) {
      break
    }
  }

  return result
}

function pathSet(map, path, value) {
  let leaf = map

  for (let i = 0; i < path.length; i += 1) {
    const key = path[i]

    if (i === path.length - 1) {
      leaf.set(key, value)
      break
    }

    if (!leaf.has(key)) {
      leaf.set(key, new WeakMap())
    }
    leaf = leaf.get(key)
  }

  return map
}


function pathRemove(map, path) {
  let leaf = map

  for (let i = 0; i < path.length; i += 1) {
    const key = path[i]

    if (i === path.length - 1) {
      leaf.delete(key)

      return true
    }

    leaf = leaf.get(key)
    if (!leaf) {
      return false
    }
  }

  return false
}

function memoize(fn) {
  const map = new WeakMap()

  return curryN(fn.length, (...args) => {
    let result = pathGet(map, args)
    if (!result) {
      result = fn(...args)
      pathSet(map, args, result)
    }

    return result
  })
}


module.exports = { memoize, pathGet, pathSet, pathRemove }
