const R = require("ramda")
const runQuery = require("./run-query")
const parseQuery = require("./parser")
const sortFunctions = require("./utils/sort")

const createPredicate = R.compose(
  runQuery,
  parseQuery
)

createPredicate.sortFunctions = sortFunctions

module.exports = createPredicate
