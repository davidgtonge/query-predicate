import * as R from 'ramda'
import parseQuery from './parser.js'
import runQuery from './run-query.js'
import type { Predicate, QueryInput } from './types.js'
import * as sortFunctions from './utils/sort.js'

export type {
  CompoundOperator,
  FieldOperatorQuery,
  FieldQuery,
  OperatorValueMap,
  ParsedCompound,
  ParsedElemMatch,
  ParsedNode,
  ParsedQuery,
  Predicate,
  QueryInput,
  QueryObject,
  QueryOperator,
  QueryScalar,
  RegexFieldQuery,
  SwappedOperatorQuery,
} from './types.js'

export { default as parseQuery } from './parser.js'

function createPredicateImpl<T extends Record<string, unknown> = Record<string, unknown>>(
  query: QueryInput
): Predicate<T> {
  return R.compose(runQuery, parseQuery)(query) as Predicate<T>
}

const createPredicate = Object.assign(createPredicateImpl, { sortFunctions })

export default createPredicate
