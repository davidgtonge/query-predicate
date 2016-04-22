const R = require("ramda")
const operators = require("./operators")

const compoundOperators = {
  $and: R.uncurryN(2, R.allPass),
  $or: R.uncurryN(2, R.anyPass),
  $not: R.complement(R.uncurryN(2, R.allPass)),
  $nor: R.complement(R.uncurryN(2, R.anyPass))
}

const runOperatorQuery = R.curry((query, item) =>
  // console.log(query.op, query.val, item[query.key])
  operators[query.op](query.val, item[query.key])
)

const runCompoundQuery = R.curry((fn, query, item) =>
  compoundOperators[query.op](
    R.map(fn, query.queries)
  )(item)
)

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
