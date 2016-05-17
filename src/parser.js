const R = require("ramda")
const operatorFns = require("./operators").operators
const queryValueTypes = require("./operators").queryValueTypes
const compoundOperators = require("./operators").compoundOperators
const compoundKeys = R.keys(compoundOperators)
const operators = R.keys(operatorFns)
const regexKey = "$regex"
const regexOptionsKey = "$options"

const isCompound = R.contains(R.__, compoundKeys)
const isOperator = R.contains(R.__, operators)
const isElemMatch = R.equals("$elemMatch")

const explicitOperator = R.allPass([
  R.compose(R.is(Object), R.last),
  R.compose(isOperator, R.head, R.head, R.toPairs, R.last)
])

const explicitMultipleOperators = R.allPass([
  explicitOperator,
  R.compose(R.gt(R.__, 1), R.length, R.keys, R.last),
  R.compose(R.not, R.path([1, regexOptionsKey]))
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

const formatElemMatch = R.curryN(2, R.applySpec({
  _type: R.always("elemMatch"),
  key: R.compose(R.split("."), R.nthArg(0)),
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

const regexPair = R.compose(
  R.append(R.__, [regexKey]),
  R.ifElse(
    R.propIs(String, regexKey),
    R.converge(RegExp, [R.prop(regexKey), R.propOr("", regexOptionsKey)]),
    R.prop(regexKey)
  )
)

const formatWithOperatorPair = R.compose(
  formatQuery,
  R.unnest,
  R.ifElse(
    R.path([1, regexKey]),
    R.adjust(regexPair, 1),
    R.adjust(singlePair, 1)
  )
)


const headIsCompound = R.compose(isCompound, R.head)
const headIsOperator = R.compose(isOperator, R.head)
const headIsCompoundWithMultiple = R.allPass([
  headIsCompound,
  R.compose(R.isArrayLike, R.last),
  R.compose(R.gt(R.__, 1), R.length, R.last)
])

const lastToPairs = R.compose(
  R.map(R.toPairs),
  R.unless(R.isArrayLike, R.of),
  R.last
)
const lastIsNaN = R.compose(R.equals(NaN), R.last)
const lastIsRegex = R.compose(R.is(RegExp), R.last)
const lastIsFunction = R.compose(R.is(Function), R.last)

const lastKeyIsCompound = R.compose(isCompound, R.head, R.keys, R.last)
const lastKeyIsElemMatch = R.compose(isElemMatch, R.head, R.keys, R.last)


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
    [headIsCompoundWithMultiple, R.converge(formatCompound, [
      R.head, R.compose(
        R.map(R.compose(formatCompound("$and"), R.map(parsePair))),
        lastToPairs
      )
    ])],
    [headIsCompound, R.converge(formatCompound, [
      R.head, R.compose(R.map(parsePair), R.unnest, lastToPairs)
    ])],
    [lastIsRegex, R.compose(formatQuery, R.insert(1, regexKey))],
    [lastIsNaN, R.compose(formatQuery, R.insert(1, "$deepEqual"))],
    [lastIsFunction, R.compose(formatQuery, R.insert(1, "$equal"))],
    [lastKeyIsCompound, R.compose(parsePair, switchValues)],
    [lastKeyIsElemMatch, R.converge(formatElemMatch, [
      R.head,
      R.compose(R.map(parsePair), R.toPairs, R.prop("$elemMatch"), R.last)
    ])],
    [headIsOperator, R.compose(parsePair, switchValues)],
    [explicitMultipleOperators, R.compose(
      formatCompound("$and"), R.map(parsePair), mergeSplitOperatorQueries
    )],
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

const isQueryLike = R.propSatisfies(
  R.contains(R.__, ["query", "elemMatch"]),
  "_type"
)

const run = R.compose(
  R.unnest,
  R.values,
  R.evolve({true: formatCompound("$and")}),
  R.groupBy(isQueryLike),
  R.unnest,
  parseQuery
)

module.exports = run
