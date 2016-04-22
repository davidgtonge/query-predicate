require "coffee-script"

assert = require "assert"
R = require "ramda"
createPredicate = require "../src/index"

query = (list, queryObj) ->
  predicate = createPredicate(queryObj)
  R.filter(predicate, list)

suite = require "./suite"

describe "Query Predicate Tests", ->
  suite(query)
