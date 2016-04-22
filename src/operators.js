const R = require("ramda")

const equalsBy = R.curryN(3, R.converge(
  R.identical,
  [R.nthArg(1), R.converge(R.call, [R.nthArg(0), R.nthArg(2)])]
))

const lastArgIsArray = R.compose(R.isArrayLike, R.nthArg(1))

const operators = {
  $equal: R.ifElse(lastArgIsArray, R.contains, R.identical),
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
  $startsWith: (value, attr) => attr.indexOf(value) === 0,
  $endsWith: (value, attr) => R.reverse(attr).indexOf(R.reverse(value)) === 0,
  $mod: R.curry((value, attr) => attr % value[0] === value[1])
}

const queryValueTypes = {
  $in: R.is(Array),
  $nin: R.is(Array),
  $all: R.is(Array),
  $any: R.is(Array),
  $size: R.is(Number),
  $regex: R.is(RegExp),
  $regexp: R.is(RegExp),
  $like: R.is(String),
  $likeI: R.is(String),
  $between: R.allPass([R.is(Array), R.all(R.identity)]),
  $betweene: R.allPass([R.is(Array), R.all(R.identity)]),
  $mod: R.is(Array),
  $cb: R.is(Function),
  $lt: R.identity,
  $lte: R.identity,
  $gt: R.identity,
  $gte: R.identity
}

const compoundOperators = {
  $and: R.uncurryN(2, R.allPass),
  $or: R.uncurryN(2, R.anyPass),
  $not: R.complement(R.uncurryN(2, R.allPass)),
  $nor: R.complement(R.uncurryN(2, R.anyPass))
}

module.exports = {operators, queryValueTypes, compoundOperators}
