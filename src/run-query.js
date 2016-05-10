const R = require("ramda")
const operators = require("./operators").operators
const compoundOperators = require("./operators").compoundOperators

const getVal = R.useWith(
  R.path,
  [R.compose(R.split("."), R.prop("key")), R.identity]
)

const getQueryVal = R.compose(
  R.when(R.is(Function), R.flip(R.apply)([])),
  R.prop("val")
)

const getOperatorMethod = R.compose(
  R.flip(R.prop)(operators),
  R.prop("op")
)

const runOperatorQuery = R.converge(
  R.call,
  [getOperatorMethod, getQueryVal, getVal]
)

const getCompoundMethod = R.compose(
  R.flip(R.prop)(compoundOperators),
  R.prop("op"),
  R.nthArg(1)
)

const mapCompoundQueries = R.useWith(
  R.map,
  [R.identity, R.prop("queries")]
)

const runCompoundQuery = R.curryN(3, R.converge(
  R.call,
  [getCompoundMethod, mapCompoundQueries, R.nthArg(2)]
))

const runQuery = R.curry((query, data) =>
  R.ifElse(
    R.propEq("_type", "compound"),
    runCompoundQuery(runQuery),
    runOperatorQuery
  )(query, data)
)

const run = R.compose(
  R.allPass,
  R.map(runQuery)
)

module.exports = run
