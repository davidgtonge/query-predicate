function pathGet(map: WeakMap<object, unknown>, path: unknown[]): unknown {
  let result: unknown = map

  for (let i = 0; i < path.length; i += 1) {
    result = (result as WeakMap<object, unknown>).get(path[i] as object)
    if (!result) {
      break
    }
  }

  return result
}

function pathSet(map: WeakMap<object, unknown>, path: unknown[], value: unknown) {
  let leaf = map

  for (let i = 0; i < path.length; i += 1) {
    const key = path[i]

    if (i === path.length - 1) {
      leaf.set(key as object, value)
      break
    }

    if (!leaf.has(key as object)) {
      leaf.set(key as object, new WeakMap())
    }
    leaf = leaf.get(key as object) as WeakMap<object, unknown>
  }

  return map
}

function pathRemove(map: WeakMap<object, unknown>, path: unknown[]) {
  let leaf = map

  for (let i = 0; i < path.length; i += 1) {
    const key = path[i]

    if (i === path.length - 1) {
      leaf.delete(key as object)

      return true
    }

    leaf = leaf.get(key as object) as WeakMap<object, unknown>
    if (!leaf) {
      return false
    }
  }

  return false
}

export function memoize<T extends (...args: never[]) => unknown>(fn: T): T {
  const map = new WeakMap<object, unknown>()

  return ((...args: unknown[]) => {
    let result = pathGet(map, args)
    if (!result) {
      result = fn(...(args as Parameters<T>))
      pathSet(map, args, result)
    }

    return result
  }) as unknown as T
}

export { pathGet, pathRemove, pathSet }
