// @ts-nocheck
import * as R from 'ramda'
import { compoundOperators, operators } from './operators.js'
import type { ParsedNode } from './types.js'

const getVal = R.useWith(R.path, [
  R.compose(R.split('.'), R.prop('key')),
  R.identity,
])

const getQueryVal = R.compose(
  R.when(R.is(Function), R.flip(R.apply)([])),
  R.prop('val')
)

const getOperatorMethod = R.compose(R.flip(R.prop)(operators), R.prop('op'))

const runOperatorQuery = R.converge(R.call, [getOperatorMethod, getQueryVal, getVal])

const getCompoundMethod = R.compose(
  R.flip(R.prop)(compoundOperators),
  R.prop('op'),
  R.nthArg(1)
)

const mapCompoundQueries = R.useWith(R.map, [R.identity, R.prop('queries')])

const runCompoundQuery = R.curryN(
  3,
  R.converge(R.call, [getCompoundMethod, mapCompoundQueries, R.nthArg(2)])
)

function runElemMatchQuery(
  queryRunner: (query: ParsedNode, data: Record<string, unknown>) => boolean
) {
  return R.converge(R.compose, [
    R.compose(
      R.any,
      R.curry((queries: ParsedNode[], data: Record<string, unknown>) =>
        R.all(R.flip(queryRunner)(data), queries)
      ),
      R.prop('queries')
    ),
    R.compose(R.path, R.prop('key')),
  ])
}

const runQuery = R.curry((query: ParsedNode, data: Record<string, unknown>) =>
  R.cond([
    [R.propEq('_type', 'query'), runOperatorQuery],
    [R.propEq('_type', 'compound'), runCompoundQuery(runQuery)],
    [R.propEq('_type', 'elemMatch'), runElemMatchQuery(runQuery)],
  ])(query)(data)
)

const run = R.compose(R.allPass, R.map(runQuery)) as (
  queries: ParsedNode[]
) => (data: Record<string, unknown>) => boolean

export default run
