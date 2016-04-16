# Requires
require "coffee-script"

assert = require "assert"
R = require "ramda"
createPredicate = require("../src/query-predicate")

query = (list, queryObj) ->
  R.filter(createPredicate(queryObj), list)

suite = require "./suite"

describe "Query Predicate Tests", ->

  suite(query)
