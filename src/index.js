const R = require("ramda")
const runQuery = require("../src/run-query")
const parseQuery = require("../src/parser")

const createPredicate = R.compose(
  runQuery,
  parseQuery
)

module.exports = createPredicate
