/* eslint-env node, mocha */

const assert = require("assert")
const run = require("../src/run-query")
const R = require("ramda")

// I need to know the types of things
/*
types are:
compounds with arrays
queries


*/
const sampleData = [
  {foo: true, bar: true, id:1},
  {foo: true, bar: false, id:2}

]


const specs = {
  equal: [
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true}
    ]}],
    [1, 2]
  ],
  "multiple simple keys": [
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true},
      {_type:"query", key:"bar", op:"$equal", val: false}
    ]}],
    [2]
  ],
}

// Array of 2 = compound
// Array of 3 = query by key

describe("query-runner", () => {
  function createTest(spec, name) {
    it("correctly runs test: " + name, () => {
      const result = R.filter(run(spec[0]), sampleData)
      console.log(JSON.stringify(result, null, 4))
      assert.deepEqual(R.pluck("id", result), spec[1])
    })
  }
  R.mapObjIndexed(createTest, specs)

})
