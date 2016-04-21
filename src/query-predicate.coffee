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
  some: R.any

# Returns a string denoting the type of object
utils.getType =  (obj) ->
  type = Object.prototype.toString.call(obj).substr(8)
  type.substr(0, (type.length - 1))

# An array of the compound modifers that can be used in queries
utils.compoundKeys = ["$and", "$not", "$or", "$nor"]

utils.expectedArrayQueries = ["$and", "$or", "$nor"]

utils.equalsBy = (fn) ->
  R.curry (a, b) ->
    R.identical(a, fn(b))


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


fnObject = R.curry (key, queryParam, out) ->
  R.cond([
    [
      R.always(utils.includes(key, utils.compoundKeys)) #R.compose(R.contains(R.__, utils.compoundKeys), R.nthArg(2)),
      R.merge(R.__, {
        key:null,
        value: parseSubQuery(queryParam, key)
        type: key
      })
    ],
    [
      R.always(utils.keys(queryParam).length > 1) #R.compose(R.lt(1), R.length, R.keys)
      R.merge(R.__, {
        type: "$and"
        value: parseSubQuery multipleConditions(queryParam, key)
        key: null
      })
    ],
    [
      R.T,
      R.tap(R.partial(console.log, ["here..."])) #R.merge(R.__, fn2(queryParam))
    ]
  ])(out)



fn2 = (queryParam) ->
  console.log("HERER!!!!")
  o = {}
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
      return o
    else throw new Error("Query value (#{value}) doesn't match query type: (#{type})")




fn23 = (key, queryParam) ->
  paramType = utils.getType(queryParam)
  out = R.pipe(
    R.assoc("key", R.__, {type:"$equal", value: queryParam})
    R.when(
      R.always(key.indexOf(".") isnt -1)
      R.assoc("getter", utils.makeGetter(key))
    )
  )(key)
  a = R.cond([
    [
      R.compose(R.contains(R.__, ["RegExp", "Date"]), R.nthArg(1)),
      R.assoc("type", "$#{paramType.toLowerCase()}")
    ],
    [
      R.compose(R.equals("Object"), R.nthArg(1)),
      fnObject(key, queryParam)
    ],
    [R.T, R.identity]
  ])(out, paramType)
  #console.log(a)
  a



parseParamType = (query) ->
  result = []
  for own key, queryParam of query
    o = fn23(key, queryParam)
    #p = fn(key, queryParam)

    paramType = utils.getType(queryParam)
    switch paramType
    # Test for Regexs and Dates as they can be supplied without an operator
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
    #console.log(p)
    console.log(o)
    #o = p

    # For "$equal" queries with arrays or objects we need to perform a deep equal
    if (o.type is "$equal") and (utils.includes(paramType, ["Object", "Array"]))
      o.type = "$deepEqual"
    else if utils.isNaN(o.value)
      o.type = "$deepEqual"

    result.push(o)

  # Return the query object
  return result

isOrQueryWithMultipleKeys = (type) ->
  R.both(
    R.compose(R.lte(2), R.length)
    R.always(R.equals(type, "$or"))
  )


parseSubQuery = (rawQuery, type) ->
  R.pipe(
    R.when(
      R.complement(utils.isArray)
      R.pipe(R.mapObjIndexed(R.flip(R.objOf)), R.values)
    )
    R.map(
      R.pipe(
        parseParamType,
        R.when(
          isOrQueryWithMultipleKeys(type)
          R.pipe(
            R.assoc("parsedQuery", R.__, {type:"$and"})
            R.append(R.__, [])
          )
        )
      )
    )
    R.flatten
  )(rawQuery)

queryValueTypes =
  $in: R.is(Array)
  $nin: R.is(Array)
  $all: R.is(Array)
  $any: R.is(Array)
  $size: R.is(Number)
  $regex: R.is(RegExp)
  $regexp: R.is(RegExp)
  $like: R.is(String)
  $likeI: R.is(String)
  $between: R.allPass([R.is(Array), R.all(R.identity)])
  $betweene: R.allPass([R.is(Array), R.all(R.identity)])
  $mod: R.is(Array)
  $cb: R.is(Function)
  $lt: R.identity
  $lte: R.identity
  $gt: R.identity
  $gte: R.identity


testQueryValue = (queryType, value) ->
  return true unless queryValueTypes[queryType]
  queryValueTypes[queryType](value)



# Test each attribute that is being tested to ensure that is of the correct type
testModelAttribute = R.curry (queryType, value) ->
  valueType = utils.getType(value)
  switch queryType
    when "$like", "$likeI", "$regex", "$startsWith", "$endsWith"  then valueType is "String"
    when "$contains", "$all", "$any", "$elemMatch" then valueType is "Array"
    when "$size"                      then utils.includes(valueType, ["String","Array"])
    when "$in", "$nin"                then value?
    else true


operators =
  $equal: (value, attr) ->
    # If the attribute is an array then search for the query value in the array the same as Mongo
    if utils.isArray(attr) then utils.includes(value, attr) else (attr is value)
  $deepEqual: utils.isEqual
  $contains: utils.includes
  $ne: R.complement R.equals
  $lt: R.flip R.lt
  $lte: R.flip R.lte
  $gt: R.flip R.gt
  $gte: R.flip R.gte
  $between: R.uncurryN(2, R.compose(R.allPass, R.zipWith(R.call, [R.lt, R.gt])))
  $betweene: R.uncurryN(2, R.compose(R.allPass, R.zipWith(R.call, [R.lte, R.gte])))
  $in: R.flip(R.contains)
  $nin: R.complement R.flip(R.contains)
  $all: R.converge(R.eqBy(R.length), [R.intersection, R.identity])
  $any: R.compose(R.length, R.intersection)
  $size: utils.equalsBy(R.length)
  $exists:  utils.equalsBy(R.complement(R.isNil))
  $has:  utils.equalsBy(R.complement(R.isNil))
  $like: R.curry (value, attr) -> attr.indexOf(value) isnt -1
  $likeI: R.curry (value, attr) -> attr.toLowerCase().indexOf(value) isnt -1
  $startsWith: R.curry (value, attr) -> attr.toLowerCase().indexOf(value) is 0
  $endsWith: R.curry (value, attr) -> utils.reverseString(attr).indexOf(value) is 0
  $type: R.type
  $regex: R.test
  $regexp: R.test
  $mod: R.curry (value, attr) -> (attr % value[0]) is value[1]

# Perform the actual query logic for each query and each model/attribute
performQuery = R.curry (type, value, attr, model) ->
  # Handle types of queries that should not be dynamic first
  if type in utils.compoundKeys then return performQuerySingle(type, value, model)
  if typeof value is 'function' then value = value()
  operators[type](value, attr)


# This function should accept an obj like this:
# $and: [queries], $or: [queries]
# should return false if fails
single = R.curry (queries, model) ->
  for queryObj in queries
    # Early false return if any of the queries fail
    return false unless performQuerySingle(queryObj.type, queryObj.parsedQuery, model)
  # All queries passes, so return true
  true


compoundOperators =
  $and: R.uncurryN 2, R.allPass # All Pass
  $or: R.uncurryN 2, R.anyPass # 1+ Pass
  $not: R.complement R.uncurryN(2, R.allPass) # 1+ fails ???
  $nor: R.complement R.uncurryN(2, R.anyPass) # All fail ???

getAttribute = R.curry (q, model) ->
  if q.getter
    q.getter model, q.key
  else
    model[q.key]

runCorrectQuery = R.curry (q, model, attr) ->
  if q.parsedQuery #nested queries
    single([q])(model)
  else
    performQuery q.type, q.value, attr, model

createQueryPredicate = R.curry (model, q) ->
  R.pipe(
    getAttribute(q)
    R.both(
      testModelAttribute(q.type)
      runCorrectQuery(q, model)
    )
  )

performQuerySingle = (type, query, model) ->
  queries = R.map(createQueryPredicate(model), query)
  compoundOperators[type](queries, model)


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

module.exports = (query) -> single(parseQuery(query))

console.log(fnObject("$and", { '$equal': 'About' }, {} ))
