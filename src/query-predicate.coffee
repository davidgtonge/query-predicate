###
Underscore Query - A lightweight query API for JavaScript collections
(c)2016 - Dave Tonge
May be freely distributed according to MIT license.

This is small library that provides a query api for JavaScript arrays similar to *mongo db*.
The aim of the project is to provide a simple, well tested, way of filtering data in JavaScript.
###

root = this
R = require "ramda"

### UTILS ###
utils =
  isArray: Array.isArray
  keys: Object.keys
  isEqual: R.equals
  find: R.find
  filter: R.filter
  first: R.head
  map: R.map
  reduce: R.reduce
  intersection: R.intersection
  includes: R.contains
  isNaN: Number.isNaN
  makeObj: R.objOf
  reverseString: R.compose(R.toLower, R.reverse)

# Returns a string denoting the type of object
utils.getType =  (obj) ->
  type = Object.prototype.toString.call(obj).substr(8)
  type.substr(0, (type.length - 1))

# An array of the compound modifers that can be used in queries
utils.compoundKeys = ["$and", "$not", "$or", "$nor"]

utils.expectedArrayQueries = ["$and", "$or", "$nor"]

lookup = (keys, obj) ->
  out = obj
  for key, idx in keys
    # Add support for #21
    if utils.isArray(out)
      remainingKeys = keys.slice(idx)
      mapFn = (v) -> lookup(remainingKeys, v)
      out = utils.map mapFn, out
    else if out
      if utils.getType(out[key]) is "Function"
        out = out[key]()
      else
        out = out[key]
    else break
  out

# Returns a getter function that works with dot notation and named functions
utils.makeGetter = (keys) ->
  keys = keys.split(".")
  (obj) -> lookup(keys, obj)

multipleConditions = (key, queries) ->
  (for type, val of queries
    utils.makeObj key, utils.makeObj(type, val))

parseParamType = (query) ->
  result = []
  for own key, queryParam of query
    o = {key}
    if queryParam?.$boost
      o.boost = queryParam.$boost
      delete queryParam.$boost

    # If the key uses dot notation, then create a getter function
    if key.indexOf(".") isnt -1
      o.getter = utils.makeGetter(key)

    paramType = utils.getType(queryParam)
    switch paramType
    # Test for Regexs and Dates as they can be supplied without an operator
      when "RegExp", "Date"
        o.type = "$#{paramType.toLowerCase()}"
        o.value = queryParam

      when "Object"
      # If the key is one of the compound keys, then parse the param as a raw query
        if utils.includes(key, utils.compoundKeys)
          o.type = key
          o.value = parseSubQuery queryParam, key
          o.key = null

        # Multiple conditions for the same key
        else if utils.keys(queryParam).length > 1
          o.type = "$and"
          o.value = parseSubQuery multipleConditions(key, queryParam)
          o.key = null

        # Otherwise extract the key and value
        else
          for own type, value of queryParam
            # Before adding the query, its value is checked to make sure it is the right type
            if testQueryValue type, value
              o.type = type
              switch type
                when "$elemMatch" then o.value = single(parseQuery(value))
                when "$endsWith" then o.value = utils.reverseString(value)
                when "$likeI", "$startsWith" then o.value = value.toLowerCase()
                when "$not", "$nor", "$or", "$and"
                  o.value = parseSubQuery utils.makeObj(o.key, value)
                  o.key = null
                when "$computed"
                  o = utils.first parseParamType(utils.makeObj(key, value))
                  o.getter = utils.makeGetter(key)
                else o.value = value
            else throw new Error("Query value (#{value}) doesn't match query type: (#{type})")
      # If the query_param is not an object or a regexp then revert to the default operator: $equal
      else
        o.type = "$equal"
        o.value = queryParam

    # For "$equal" queries with arrays or objects we need to perform a deep equal
    if (o.type is "$equal") and (utils.includes(paramType, ["Object", "Array"]))
      o.type = "$deepEqual"
    else if utils.isNaN(o.value)
      o.type = "$deepEqual"

    result.push(o)

  # Return the query object
  return result


# This function parses and normalizes raw queries.
parseSubQuery = (rawQuery, type) ->
  # Ensure that the query is an array
  if utils.isArray(rawQuery)
    queryArray = rawQuery
  else
    queryArray = (utils.makeObj(key, val) for own key, val of rawQuery)

  iteratee = (memo, query) ->
    parsed = parseParamType(query)
    if (type == "$or" && parsed.length >= 2) # support $or with 2 or more conditions
      memo.push {type:"$and", parsedQuery: parsed}
      return memo
    else
      memo.concat parsed

  # Loop through all the different queries
  utils.reduce(iteratee, [], queryArray)

# Tests query value, to ensure that it is of the correct type
testQueryValue = (queryType, value) ->
  valueType = utils.getType(value)
  switch queryType
    when "$in","$nin","$all", "$any"  then valueType is "Array"
    when "$size"                      then valueType is "Number"
    when "$regex", "$regexp"          then valueType is "RegExp"
    when "$like", "$likeI"            then valueType is "String"
    when "$between", "$mod"           then (valueType is "Array") and (value.length is 2)
    when "$cb"                        then valueType is "Function"
    else true

# Test each attribute that is being tested to ensure that is of the correct type
testModelAttribute = (queryType, value) ->
  valueType = utils.getType(value)
  switch queryType
    when "$like", "$likeI", "$regex", "$startsWith", "$endsWith"  then valueType is "String"
    when "$contains", "$all", "$any", "$elemMatch" then valueType is "Array"
    when "$size"                      then utils.includes(valueType, ["String","Array"])
    when "$in", "$nin"                then value?
    else true

# Perform the actual query logic for each query and each model/attribute
performQuery = (type, value, attr, model, getter) ->
  # Handle types of queries that should not be dynamic first
  switch type
    when "$and", "$or", "$nor", "$not"
      return performQuerySingle(type, value, getter, model)
    when "$cb"              then return value.call model, attr
    when "$elemMatch"       then return (runQuery(attr,value, null, true))

  # If the query attribute is a function and the value isn't, it should be dynamically evaluated.
  value = value() if typeof value is 'function'

  switch type
    when "$equal"
      # If the attribute is an array then search for the query value in the array the same as Mongo
      if utils.isArray(attr) then utils.includes(value, attr) else (attr is value)
    when "$deepEqual"       then utils.isEqual(attr, value)
    when "$contains"        then utils.includes(value, attr)
    when "$ne"              then attr isnt value
    when "$lt"              then value? and attr < value
    when "$gt"              then value? and attr > value
    when "$lte"             then value? and attr <= value
    when "$gte"             then value? and attr >= value
    when "$between"         then value[0]? and value[1]? and value[0] < attr < value[1]
    when "$betweene"        then value[0]? and value[1]? and value[0] <= attr <= value[1]
    when "$in"              then utils.includes(attr, value)
    when "$nin"             then not utils.includes(attr, value)
    when "$all"             then utils.intersection(value, attr).length is value.length
    when "$any"             then utils.intersection(value, attr).length
    when "$size"            then attr.length is value
    when "$exists", "$has"  then attr? is value
    when "$like"            then attr.indexOf(value) isnt -1
    when "$likeI"           then attr.toLowerCase().indexOf(value) isnt -1
    when "$startsWith"      then attr.toLowerCase().indexOf(value) is 0
    when "$endsWith"        then utils.reverseString(attr).indexOf(value) is 0
    when "$type"            then typeof attr is value
    when "$regex", "$regexp" then value.test attr
    when "$mod"             then (attr % value[0]) is value[1]
    else false

# This function should accept an obj like this:
# $and: [queries], $or: [queries]
# should return false if fails
single = (queries, getter) ->
  getter = parseGetter(getter) if getter
  (model) ->
    for queryObj in queries
      # Early false return if any of the queries fail
      return false unless performQuerySingle(queryObj.type, queryObj.parsedQuery, getter, model)
    # All queries passes, so return true
    true

performQuerySingle = (type, query, getter, model) ->
  passes = 0
  score = 0
  scoreInc = 1 / query.length

  for q in query
    if getter
      attr = getter model, q.key
    else if q.getter
      attr = q.getter model, q.key
    else
      attr = model[q.key]
    # Check if the attribute value is the right type (some operators need a string, or an array)
    test = testModelAttribute(q.type, attr)
    # If the attribute test is true, perform the query
    if test
      if q.parsedQuery #nested queries
        test = single([q], getter)(model)
      else test = performQuery q.type, q.value, attr, model, getter
    if test
      passes++

    switch type
      when "$and"
        # Early false return for $and queries when any test fails
        return false unless test
      when "$not"
        # Early false return for $not queries when any test passes
        return false if test
      when "$or"
        # Early true return for $or queries when any test passes
        return true if test
      when "$nor"
        # Early false return for $nor queries when any test passes
        return false if test
      else
        throw new Error("Invalid compound method")

  # For not queries, check that all tests have failed
  if type is "$not"
    passes is 0
  # $or queries have failed as no tests have passed
  # $and queries have passed as no tests failed
  # $nor queries have passed as no tests passed
  else
    type isnt "$or"


# The main function to parse raw queries.
# Queries are split according to the compound type ($and, $or, etc.) before being parsed with parseSubQuery
parseQuery = (query) ->
  queryKeys = utils.keys(query)
  return [] unless queryKeys.length
  compoundQuery = utils.intersection utils.compoundKeys, queryKeys

  for type in compoundQuery
    if not utils.isArray(query[type]) and utils.includes(type, utils.expectedArrayQueries)
      throw new Error(type + ' query must be an array')

  # If no compound methods are found then use the "and" iterator
  if compoundQuery.length is 0
    return [{type:"$and", parsedQuery:parseSubQuery(query)}]
  else
    # find if there is an implicit $and compundQuery operator
    if compoundQuery.length isnt queryKeys.length
      # Add the and compund query operator (with a sanity check that it doesn't exist)
      if not utils.includes("$and", compoundQuery)
        query.$and = {}
        compoundQuery.unshift "$and"
      for own key, val of query when not utils.includes(key, utils.compundKeys)
        query.$and[key] = val
        delete query[key]
    (for type in compoundQuery
      {type, parsedQuery:parseSubQuery(query[type], type)})


parseGetter = (getter) ->
  return if typeof getter is 'string' then (obj, key) -> obj[getter](key) else getter

runQuery = (items, query, getter, first) ->
  if arguments.length < 2
    # If no arguments or only the items are provided, then use the buildQuery interface
    return buildQuery.apply this, arguments
  if getter then getter = parseGetter(getter)
  query = single(parseQuery(query), getter) unless (utils.getType(query) is "Function")

  if first
    fn = utils.find
  else
    fn = utils.filter
  fn query, items



module.exports = (query) -> single(parseQuery(query))
