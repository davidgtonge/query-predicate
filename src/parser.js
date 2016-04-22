const R = require("ramda")
const operatorFns = require("./operators").operators
const queryValueTypes = require("./operators").queryValueTypes
const compoundKeys = ["$and", "$or", "$nor", "$not"]
const operators = R.keys(operatorFns)

const isCompound = R.contains(R.__, compoundKeys)
const isOperator = R.contains(R.__, operators)
const explicitOperator = R.allPass([
  R.compose(R.is(Object), R.last),
  R.compose(isOperator, R.head, R.head, R.toPairs, R.last)
])

const getQueryTypeFn = R.flip(R.propOr(R.T))(queryValueTypes)
function throwOnInvalidQueryVal(q) {
  throw new Error(q.op + " query value (" + q.val + ") isn't valid")
}

const assertValidQueryValue = R.compose(
  R.unless(
    R.converge(R.call, [
      R.compose(getQueryTypeFn, R.prop("op")), R.prop("val")
    ]),
    throwOnInvalidQueryVal
  )
)

const formatQuery = R.compose(
  assertValidQueryValue,
  R.applySpec({
    _type: R.always("query"),
    key: R.head,
    op: R.nth(1),
    val: R.last
  })
)

const formatCompound = R.curryN(2, R.applySpec({
  _type: R.always("compound"),
  op: R.nthArg(0),
  queries: R.compose(R.unnest, R.nthArg(1))
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
const headIsOperator = R.compose(isOperator, R.head)
const lastToPairs = R.compose(
  R.unnest,
  R.map(R.toPairs),
  R.unless(R.isArrayLike, R.of),
  R.last
)
const lastIsNaN = R.compose(R.equals(NaN), R.last)
const lastIsRegex = R.compose(R.is(RegExp), R.last)

const lastKeyIsCompound = R.compose(isCompound, R.head, R.keys, R.last)

const hasMultipleOperators = R.compose(R.gt(R.__, 1), R.length, R.keys, R.last)

const splitMultilpleOperatorQueries = R.compose(
  R.map(R.compose(R.of, R.apply(R.objOf))),
  R.toPairs,
  R.last
)

const mergeSplitOperatorQueries = R.converge(
  R.map,
  [R.compose(R.prepend, R.head), splitMultilpleOperatorQueries]
)

function parsePair(pair) {
  return R.cond([
    [headIsCompound, R.converge(formatCompound, [
      R.head, R.compose(R.map(parsePair), lastToPairs)
    ])],
    [lastIsRegex, R.compose(formatQuery, R.insert(1, "$regexp"))],
    [lastIsNaN, R.compose(formatQuery, R.insert(1, "$deepEqual"))],
    [lastKeyIsCompound, R.compose(parsePair, switchValues)],
    [headIsOperator, R.compose(parsePair, switchValues)],
    [explicitOperator, R.ifElse(
      hasMultipleOperators,
      R.compose(R.map(parsePair), mergeSplitOperatorQueries),
      formatWithOperatorPair
    )],
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
  R.unnest,
  parseQuery
)

module.exports = run
