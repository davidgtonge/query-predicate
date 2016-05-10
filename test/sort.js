/* eslint-env node, mocha */

const {
  createFilterPermutation,
  createSortMap,
  filterAndSort,
  filterNoSort
} = require("../src/utils/sort")
const {deepEqual, equal} = require("assert")

const collection = [
  {a: 1, b:{c: 3}},
  {a: 2, b:{c: 2}},
  {a: 3, b:{c: 1}},
  {a: 4, b:{c: 5}},
  {a: 5, b:{c: 4}}
]


describe("createFilterPermutation", () => {
  it("works with simple query", () => {
    const query = {a: 3}
    const result = createFilterPermutation(collection, query)
    deepEqual(result, {2: true})
  })

  it("works with a complex query", () => {
    const query = {a: {$gt:3}}
    const result = createFilterPermutation(collection, query)
    deepEqual(result, {3: true, 4: true})
  })
})

describe("createSortMap", () => {
  it("works with simple query", () => {
    const query = {a: 1}
    const result = createSortMap(collection, query)
    equal(result.get(collection[0]), 0)
    equal(result.get(collection[1]), 1)
    equal(result.get(collection[2]), 2)
    equal(result.get(collection[3]), 3)
  })

  it("works with simple query reversed", () => {
    const query = {a: -1}
    const result = createSortMap(collection, query)
    equal(result.get(collection[0]), 4)
    equal(result.get(collection[1]), 3)
    equal(result.get(collection[2]), 2)
    equal(result.get(collection[3]), 1)
    equal(result.get(collection[4]), 0)
  })

  it("works with deep query", () => {
    const query = {"b.c": 1}
    const result = createSortMap(collection, query)
    equal(result.get(collection[0]), 2)
    equal(result.get(collection[1]), 1)
    equal(result.get(collection[2]), 0)
    equal(result.get(collection[3]), 4)
    equal(result.get(collection[4]), 3)
  })

})

describe("filtering", () => {
  it("filterNoSort works with a single filter", () => {
    const result = filterNoSort([{a:1}], collection)
    deepEqual(result, [collection[0]])
  })

  it("filterNoSort works with 2 filters", () => {
    const result = filterNoSort([{a:{$gt:1}}, {"b.c":{$lt: 4}}], collection)
    deepEqual(result, [collection[1], collection[2]])
  })

  it("filterAndSort works with a single filter", () => {
    const result = filterAndSort([{a:{$gt:2}}], {a:-1}, collection)
    deepEqual(result, [collection[4], collection[3], collection[2]])
  })
})
