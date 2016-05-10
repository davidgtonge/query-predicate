/* eslint-env node, mocha */

const {
  memoize, pathGet, pathSet, pathRemove
} = require("../src/utils/memoize")
const {ok, equal, notEqual} = require("assert")

describe("path utils", () => {
  it("sets with a single item in the path", () => {
    const a = new WeakMap()
    const key = {}
    const val = {}
    pathSet(a, [key], val)
    ok(a.has(key))
    equal(a.get(key), val)
  })

  it("sets with a multiple items in the path", () => {
    const a = new WeakMap()
    const key = {}
    const key2 = []
    const val = {}
    pathSet(a, [key, key2], val)
    ok(a.has(key))
    ok(a.get(key).has(key2))
    equal(a.get(key).get(key2), val)
  })

  it("gets with a multiple items in the path", () => {
    const a = new WeakMap()
    const key = {}
    const key2 = []
    const val = {}
    pathSet(a, [key, key2], val)
    equal(pathGet(a, [key, key2]), val)
  })

  it("gets with a single item in the path", () => {
    const a = new WeakMap()
    const key = {}
    const val = {}
    pathSet(a, [key], val)
    equal(pathGet(a, [key]), val)
  })

  it("returns null if path doesn't exist", () => {
    const a = new WeakMap()
    equal(pathGet(a, [{}, {}]), null)
  })

  it("removes with a multiple items in the path", () => {
    const a = new WeakMap()
    const key = {}
    const key2 = {}
    const val = {}
    pathSet(a, [key, key2], val)
    equal(pathGet(a, [key, key2]), val)
    pathRemove(a, [key, key2])
    equal(pathGet(a, [key, key2]), null)
  })

  it("removes with a single item in the path", () => {
    const a = new WeakMap()
    const key = {}
    const val = {}
    pathSet(a, [key], val)
    equal(pathGet(a, [key]), val)
    pathRemove(a, [key])
    equal(pathGet(a, [key]), null)
  })
})

describe("memoize", () => {
  it("correctly caches the result", () => {
    const random = memoize(Math.random)
    const key1 = {}
    equal(random(key1), random(key1))
  })

  it("correctly caches the result for multiple arguments", () => {
    const random = memoize(Math.random)
    const key1 = {}
    const key2 = []
    equal(random(key1, key2), random(key1, key2))
    notEqual(random(key1, []), random(key1, key2))
    notEqual(random(key1), random(key1, key2))
  })

  it("correctly returns different results for different inputs", () => {
    const random = memoize(Math.random)
    const key1 = {}
    const key2 = {}
    equal(random(key1), random(key1))
    equal(random(key2), random(key2))
    notEqual(random(key1), random(key2))
  })
})
