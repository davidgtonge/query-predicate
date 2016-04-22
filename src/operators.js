const R = require("ramda")

function equalsBy(fn) {
  return R.curry((a, b) => R.identical(a, fn(b)))
}
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

module.exports = operators
