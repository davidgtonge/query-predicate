const {
  curry, reduce, reduced, path, when, compose, sortBy, split, head,
  range, length, identity, filter, __, nth, map, toPairs,
  reverse, useWith, forEach, always
} = require("ramda")
const createPredicate = require("../index")
const {memoize} = require("./memoize")

function invertArrayToMap(array) {
  const mapInstance = new WeakMap()
  const len = array.length
  for (let idx = 0; idx < len; idx += 1) {
    mapInstance.set(array[idx], idx);
  }

  return mapInstance
}

const reduceObjs = curry((idx, final, permutationObject) =>
  permutationObject[idx] ? true : reduced(false)
)

const filterReducer = curry((filterPermutations, output, idx) => {
  if (reduce(reduceObjs(idx), false, filterPermutations)) {
    output.push(idx)
  }

  return output
})

function createSortFn(sortQuery) {
  const [sortPath, direction] = compose(head, toPairs)(sortQuery)
  const sortFn = compose(path, split("."))(sortPath)
  const shouldReverse = direction === -1

  return [sortFn, shouldReverse]
}


const createSortMap = memoize((collection, sortQuery) => {
  const [sortByFn, shouldReverse] = createSortFn(sortQuery)

  return compose(
    invertArrayToMap,
    when(always(shouldReverse), reverse),
    sortBy(sortByFn)
  )(collection)
})

const applySortReducer = curry((collection, sortMap, output, index) => {
  const val = collection[index]
  const position = sortMap.get(val)
  output[position] = val

  return output
})

const permutationReducer = curry((predicate, output, value, idx) => {
  if (predicate(value)) {
    output[idx] = true
  }

  return output
})

const createFilterPermutation = memoize(curry((collection, query) => {
  const predicate = createPredicate(query)

  return collection.reduce(permutationReducer(predicate), {})
}))

// Creates a sorted sparse array and then compacts it
function combinePermutations(filterPermutations, sortMap, collection) {
  return compose(
    filter(identity),
    reduce(applySortReducer(collection, sortMap), []),
    reduce(filterReducer(filterPermutations), []),
    range(0),
    length
  )(collection)
}

// Creates a unsorted array
function combinePermutations2(filterPermutations, collection) {
  return compose(
    map(nth(__, collection)),
    reduce(filterReducer(filterPermutations), []),
    range(0),
    length
  )(collection)
}

// function sortByMap(sortMap, collection) {
//   return sortBy(sortMap.get.bind(sortMap), collection)
// }


const queryCache = {}
function getCachedQuery(query) {
  const key = JSON.stringify(query)
  const result = queryCache[key]
  if (result) {
    return result
  }
  queryCache[key] = query

  return query
}

const getFilterPermutation = useWith(
  createFilterPermutation,
  [identity, getCachedQuery]
)

const getSortPermutation = useWith(
  createSortMap,
  [identity, getCachedQuery]
)

function filterAndSort(filterQueries, sortQuery, collection) {
  return combinePermutations(
    map(getFilterPermutation(collection), filterQueries),
    getSortPermutation(collection, sortQuery),
    collection
  )
}

function filterNoSort(filterQueries, collection) {
  return combinePermutations2(
    map(getFilterPermutation(collection), filterQueries),
    collection
  )
}

function primeFilterCache(collection, queries) {
  forEach(getFilterPermutation(collection), queries)
}

function primeSortCache(collection, queries) {
  forEach(getSortPermutation(collection), queries)
}


module.exports = {
  createSortMap,
  createFilterPermutation,
  combinePermutations,
  combinePermutations2,
  filterAndSort,
  filterNoSort,
  primeFilterCache,
  primeSortCache
}
