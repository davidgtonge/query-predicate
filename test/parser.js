/* eslint-env node, mocha */

const assert = require("assert")
const parse = require("../src/parser")
const R = require("ramda")

// I need to know the types of things
/*
types are:
compounds with arrays
queries


*/

const specs = {
  simple: [
    {foo: true},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true}
    ]}]
  ],
  "explicit operator" : [
    {foo: {$equal: true}},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true}
    ]}]
  ],
  "operator and key swapped" : [
    {$equal: {foo: true}},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true}
    ]}]
  ],
  "multiple simple keys": [
    {foo: true, bar: false},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true},
      {_type:"query", key:"bar", op:"$equal", val: false}
    ]}]
  ],
  "multiple expicit operators": [
    {foo: { $equal: true}, bar: {$equal: false}},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true},
      {_type:"query", key:"bar", op:"$equal", val: false}
    ]}]
  ],
  "mixture of simple and expicit": [
    {foo: { $equal: true}, bar: false},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true},
      {_type:"query", key:"bar", op:"$equal", val: false}
    ]}]
  ],
  "explicit compound": [
    {$and: {foo: {$equal: true}}},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true}
    ]}]
  ],
  "explicit compound with array": [
    {$and: [{foo: {$equal: true}}]},
    [{_type: "compound", op: "$and", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true}
    ]}]
  ],
  "explicit compound - not $and": [
    {$or: {foo: {$equal: true}}},
    [{_type: "compound", op: "$or", queries: [
      {_type:"query", key:"foo", op:"$equal", val: true}
    ]}]
  ],
  "multiple compound operators": [
    {$and: {foo: true}, $not: {bar: false}},
    [
      {_type: "compound", op: "$and", queries: [
        {_type:"query", key:"foo", op:"$equal", val: true}
      ]},
      {_type: "compound", op: "$not", queries: [
        {_type:"query", key:"bar", op:"$equal", val: false}
      ]}
    ]
  ],
  "nested compound": [
    {$and: {
      foo: true,
      $or: [{bar:false}, {foobar: true}]
    }},
    [
      {_type: "compound", op: "$and", queries: [
        {_type:"query", key:"foo", op:"$equal", val: true},
        {_type:"compound", op: "$or", queries: [
          {_type:"query", key:"bar", op:"$equal", val: false},
          {_type:"query", key:"foobar", op:"$equal", val: true},
        ]}
      ]}
    ]
  ]
}

// Array of 2 = compound
// Array of 3 = query by key

describe("parser", () => {
  function createTest(spec, name) {
    it("parses: " + name, () => {
      const result = parse(spec[0])
      console.log(JSON.stringify(result, null, 4))
      assert.deepEqual(result, spec[1])
    })
  }
  R.mapObjIndexed(createTest, specs)

})
