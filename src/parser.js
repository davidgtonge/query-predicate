const R = require("ramda")
const compoundKeys = ["$and", "$or", "$nor", "$not"]
const operators = ["$equal"]

const isCompound = R.contains(R.__, compoundKeys)
const isOperator = R.contains(R.__, operators)
const explicitOperator = R.allPass([
  R.compose(R.is(Object), R.last),
  R.compose(isOperator, R.head, R.head, R.toPairs, R.last)
])

const formatQuery = R.applySpec({
  _type: R.always("query"),
  key: R.head,
  op: R.nth(1),
  val: R.last
})

const formatCompound = R.curryN(2, R.applySpec({
  _type: R.always("compound"),
  op: R.nthArg(0),
  queries: R.nthArg(1)
}))

const singlePair = R.compose(R.head, R.toPairs)

const getRest = R.converge(
  R.objOf,
  [R.head, R.compose(R.last, R.head, R.toPairs, R.last)]
)

const getKey = R.compose(R.head, R.head, R.toPairs, R.last)

const switchValues = R.converge(
  R.pair,
  [getKey, getRest]
)

const formatWithOperatorPair = R.compose(
  formatQuery,
  R.unnest,
  R.adjust(singlePair, 1)
)


const headIsCompound = R.compose(isCompound, R.head)
const lastToPairs = R.compose(
  R.unnest,
  R.map(R.toPairs),
  R.unless(R.isArrayLike, R.of),
  R.last
)

function parsePair(pair) {
  return R.cond([
    [headIsCompound, R.converge(formatCompound, [
      R.head, R.compose(R.map(parsePair), lastToPairs)
    ])],
    [R.compose(isOperator, R.head), R.compose(parsePair, switchValues)],
    [explicitOperator, formatWithOperatorPair],
    [R.T, R.compose(formatQuery, R.insert(1, "$equal"))]
  ])(pair)
}

function parseQuery(thing) {
  return R.cond([
    [R.isArrayLike, R.map(parseQuery)],
    [R.is(Object), R.compose(R.map(parsePair), R.toPairs)]
  ])(thing)
}

const run = R.compose(
  R.unnest,
  R.values,
  R.evolve({query: formatCompound("$and")}),
  R.groupBy(R.prop("_type")),
  parseQuery
)

module.exports = run
