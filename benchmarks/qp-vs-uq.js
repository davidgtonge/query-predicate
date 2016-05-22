const {range, map, identity, applySpec, compose, filter} = require("ramda")
const lodash = require("lodash")
const uq = require("underscore-query")
const createPredicate = require("../src/index")
const benchmark = require("./benchmark")
const query = uq(lodash, false)

function randomName(i) {
  return "name" + i % 9
}

const testArray = compose(
  map(applySpec({
    id: identity,
    name: randomName
  })),
  range(0)
)(1000)

 console.log(testArray)

function testUnderscoreQuery() {
  const result = query(testArray, {name:"name5"})
}

const predicate = createPredicate({name:"name5"})

function testQP() {
  const result = filter(predicate, testArray)
}

const spec = {
  'underscore-query': testUnderscoreQuery,
  'query-predicate': testQP,
}


benchmark(spec)
