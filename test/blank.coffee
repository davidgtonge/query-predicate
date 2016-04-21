# Requires
require "coffee-script"
assert = require('assert')
_ = require "underscore"
R = require "ramda"
createPredicate = require("../src/query-predicate")

_.query = (list, queryObj) ->
  R.filter(createPredicate(queryObj), list)

_collection =  [
  {title:"Home", colors:["red","yellow","blue"], likes:12, featured:true, content: "Dummy content about coffeescript", blank: null}
  {title:"About", colors:["red"], likes:2, featured:true, content: "dummy content about javascript", blank: ''}
  {title:"Contact", colors:["red","blue"], likes:20, content: "Dummy content about PHP", blank: undefined},
  {title:"Careers", colors:["purple","white"], likes:10, content: "Dummy content about Careers"},  # blank simply omitted
  {title:"Sponsors", colors:["green","gold"], likes:14, content: "Dummy content about Sponsors", blank: []}
]

create = -> _.clone(_collection)

describe "Underscore Query Tests: Blanks", ->

  it "handles null values", ->

    a = create()
    result = _.query a, blank:null
    assert.equal result.length, 1
    assert.equal result[0].title, "Home"


  it "handles empty values", ->

    a = create()
    result = _.query a, blank: ""
    assert.equal result.length, 1
    assert.equal result[0].title, "About"


  it "handles undefined values", ->

    a = create()
    result = _.query a, blank: undefined
    assert.equal result.length, 2
    assert.equal result[0].title, "Contact"
    assert.equal result[1].title, "Careers"


  it "handles empty array values", ->

    a = create()
    result = _.query a, blank: []
    assert.equal result.length, 1
    assert.equal result[0].title, "Sponsors"
