/* eslint-env node, mocha */

const assert = require("assert")
const run = require("../src/run-query")
const R = require("ramda")

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

describe("query-runner", () => {
  function createTest(spec, name) {
    it("correctly runs test: " + name, () => {
      const result = R.filter(run(spec[0]), sampleData)
      assert.deepEqual(R.pluck("id", result), spec[1])
    })
  }
  R.mapObjIndexed(createTest, specs)

})
