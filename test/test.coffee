# Requires
require "coffee-script"

assert = require "assert"
R = require "ramda"
#createPredicate = require("../src/query-predicate")
runQuery = require("../src/run-query")
parseQuery = require("../src/parser")


query = (list, queryObj) ->
  query = parseQuery(queryObj)
  R.filter(runQuery(query), list)

suite = require "./suite"

describe "Query Predicate Tests", ->
  suite(query)
