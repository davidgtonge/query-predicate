const R = require("ramda")

function equalsBy(fn) {
  return R.curry((a, b) => R.identical(a, fn(b)))
}

const compoundOperators = {
  $and: R.uncurryN(2, R.allPass),
  $or: R.uncurryN(2, R.anyPass),
  $not: R.complement(R.uncurryN(2, R.allPass)),
  $nor: R.complement(R.uncurryN(2, R.anyPass))
}

const operators = {
  $equal: R.identical,
  $deepEqual: R.equals,
  $contains: R.contains,
  $ne: R.complement(R.equals),
  $lt: R.flip(R.lt),
  $lte: R.flip(R.lte),
  $gt: R.flip(R.gt),
  $gte: R.flip(R.gte),
  $between: R.uncurryN(2, R.compose(
    R.allPass, R.zipWith(R.call, [R.lt, R.gt]))),
  $betweene: R.uncurryN(2, R.compose(
    R.allPass, R.zipWith(R.call, [R.lte, R.gte]))),
  $in: R.flip(R.contains),
  $nin: R.complement(R.flip(R.contains)),
  $all: R.converge(R.eqBy(R.length), [R.intersection, R.identity]),
  $any: R.compose(R.length, R.intersection),
  $size: equalsBy(R.length),
  $exists:  equalsBy(R.complement(R.isNil)),
  $has:  equalsBy(R.complement(R.isNil)),
  $like: R.curry((value, attr) => attr.indexOf(value) !== -1),
  $likeI: R.curry((value, attr) => attr.toLowerCase().indexOf(value) !== -1),
  $type: R.type,
  $regex: R.test,
  $regexp: R.test,
  $mod: R.curry((value, attr) => attr % value[0] === value[1])
}

const runOperatorQuery = R.curry((query, item) => {
  return operators[query.op](query.val, item[query.key])
})

const runCompoundQuery = R.curry((fn, query, item) => {
  return R.compose(
    compoundOperators[query.op],
    R.map(fn(R.__, item))
  )(query.queries)
})

const runQuery = R.curry((query, data) => {
  R.ifElse(
    R.propEq("_type", "compound"),
    runCompoundQuery(runQuery),
    runOperatorQuery
  )(query, data)
})

const run = R.curryN(2, R.compose(
  R.allPass,
  R.map(runQuery)
))

module.exports = run
