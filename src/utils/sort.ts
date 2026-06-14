// @ts-nocheck
import {
  __,
  always,
  compose,
  curry,
  filter,
  forEach,
  head,
  identity,
  length,
  map,
  nth,
  path,
  range,
  reduce,
  reduced,
  reverse,
  sortBy,
  split,
  toPairs,
  useWith,
  when,
} from 'ramda'
import createPredicate from '../index.js'
import type { QueryInput } from '../types.js'
import { memoize } from './memoize.js'

function invertArrayToMap<T extends object>(array: T[]) {
  const mapInstance = new WeakMap<T, number>()
  const len = array.length
  for (let idx = 0; idx < len; idx += 1) {
    mapInstance.set(array[idx], idx)
  }

  return mapInstance
}

const reduceObjs = curry((idx: number, final: boolean, permutationObject: Record<number, boolean>) =>
  permutationObject[idx] ? true : reduced(false)
)

const filterReducer = curry(
  (filterPermutations: Record<number, boolean>[], output: number[], idx: number) => {
    if (reduce(reduceObjs(idx), false, filterPermutations)) {
      output.push(idx)
    }

    return output
  }
)

function createSortFn(sortQuery: Record<string, 1 | -1>) {
  const [sortPath, direction] = compose(head, toPairs)(sortQuery) as [string, 1 | -1]
  const sortFn = compose(path, split('.'))(sortPath)
  const shouldReverse = direction === -1

  return [sortFn, shouldReverse] as const
}

const createSortMap = memoize(<T extends object>(collection: T[], sortQuery: Record<string, 1 | -1>) => {
  const [sortByFn, shouldReverse] = createSortFn(sortQuery)

  return compose(
    invertArrayToMap,
    when(always(shouldReverse), reverse),
    sortBy(sortByFn)
  )(collection)
})

const applySortReducer = curry(
  <T extends object>(collection: T[], sortMap: WeakMap<T, number>, output: T[], index: number) => {
    const val = collection[index]
    const position = sortMap.get(val)
    if (position !== undefined) {
      output[position] = val
    }

    return output
  }
)

const permutationReducer = curry(
  <T extends object>(
    predicate: (value: T) => boolean,
    output: Record<number, boolean>,
    value: T,
    idx: number
  ) => {
    if (predicate(value)) {
      output[idx] = true
    }

    return output
  }
)

const createFilterPermutation = memoize(
  curry(<T extends object>(collection: T[], query: QueryInput) => {
    const predicate = createPredicate(query)

    return collection.reduce(permutationReducer(predicate), {} as Record<number, boolean>)
  })
)

function combinePermutations<T extends object>(
  filterPermutations: Record<number, boolean>[],
  sortMap: WeakMap<T, number>,
  collection: T[]
) {
  return compose(
    filter(identity),
    reduce(applySortReducer(collection, sortMap), [] as T[]),
    reduce(filterReducer(filterPermutations), [] as number[]),
    range(0),
    length
  )(collection)
}

function combinePermutations2<T extends object>(
  filterPermutations: Record<number, boolean>[],
  collection: T[]
) {
  return compose(
    map(nth(__, collection)),
    reduce(filterReducer(filterPermutations), [] as number[]),
    range(0),
    length
  )(collection) as T[]
}

function sortByMap<T extends object>(sortMap: WeakMap<T, number>) {
  return sortBy(sortMap.get.bind(sortMap))
}

const queryCache: Record<string, QueryInput> = {}
function getCachedQuery(query: QueryInput) {
  const key = JSON.stringify(query)
  const result = queryCache[key]
  if (result) {
    return result
  }
  queryCache[key] = query

  return query
}

const getFilterPermutation = useWith(createFilterPermutation, [identity, getCachedQuery])

const getSortPermutation = useWith(createSortMap, [identity, getCachedQuery])

function filterAndSort<T extends object>(
  filterQueries: QueryInput[],
  sortQuery: Record<string, 1 | -1>,
  collection: T[]
) {
  return combinePermutations(
    map(getFilterPermutation(collection), filterQueries),
    getSortPermutation(collection, sortQuery),
    collection
  )
}

function filterAndSort2<T extends object>(
  filterQueries: QueryInput[],
  sortQuery: Record<string, 1 | -1>,
  collection: T[]
) {
  return compose(
    sortByMap(getSortPermutation(collection, sortQuery)),
    combinePermutations2(map(getFilterPermutation(collection), filterQueries), collection)
  )()
}

function filterNoSort<T extends object>(filterQueries: QueryInput[], collection: T[]) {
  return combinePermutations2(map(getFilterPermutation(collection), filterQueries), collection)
}

function primeFilterCache<T extends object>(collection: T[], queries: QueryInput[]) {
  forEach(getFilterPermutation(collection), queries)
}

function primeSortCache<T extends object>(collection: T[], queries: Record<string, 1 | -1>[]) {
  forEach(getSortPermutation(collection), queries)
}

export {
  combinePermutations,
  combinePermutations2,
  createFilterPermutation,
  createSortMap,
  filterAndSort,
  filterAndSort2,
  filterNoSort,
  primeFilterCache,
  primeSortCache,
}
