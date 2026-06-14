/** Scalar values matched with implicit `$equal`. */
export type QueryScalar = string | number | boolean | null | undefined

/** Field comparison and matching operators. */
export type QueryOperator =
  | '$equal'
  | '$deepEqual'
  | '$contains'
  | '$ne'
  | '$lt'
  | '$lte'
  | '$gt'
  | '$gte'
  | '$between'
  | '$betweene'
  | '$in'
  | '$nin'
  | '$all'
  | '$any'
  | '$size'
  | '$exists'
  | '$has'
  | '$like'
  | '$likeI'
  | '$type'
  | '$regex'
  | '$regexp'
  | '$startsWith'
  | '$endsWith'
  | '$mod'
  | '$cb'
  | '$elemMatch'

/** Logical compound operators. */
export type CompoundOperator = '$and' | '$or' | '$not' | '$nor'

/** Expected value shape for each operator key. */
export interface OperatorValueMap {
  $equal: unknown
  $deepEqual: unknown
  $contains: unknown
  $ne: unknown
  $lt: unknown
  $lte: unknown
  $gt: unknown
  $gte: unknown
  $between: [unknown, unknown]
  $betweene: [unknown, unknown]
  $in: unknown[]
  $nin: unknown[]
  $all: unknown[]
  $any: unknown[]
  $size: number
  $exists: unknown
  $has: unknown
  $like: string
  $likeI: string
  $type: string
  $regex: RegExp
  $regexp: RegExp
  $startsWith: string
  $endsWith: string
  $mod: unknown[]
  $cb: (item: unknown) => boolean
  $elemMatch: QueryInput | QueryObject
}

/** Operator conditions on a single field, e.g. `{ $gt: 5, $lt: 10 }`. */
export type FieldOperatorQuery = {
  [K in QueryOperator]?: OperatorValueMap[K]
}

/** Regex written as `{ $regex: "pat", $options: "i" }`. */
export type RegexFieldQuery = {
  $regex: string | RegExp
  $options?: string
}

/**
 * Query for one document field. A bare value uses implicit `$equal`;
 * `RegExp` and functions use implicit `$regex` / `$equal` respectively.
 */
export type FieldQuery =
  | QueryScalar
  | RegExp
  | ((value: unknown) => boolean)
  | FieldOperatorQuery
  | RegexFieldQuery

/** Object keyed by field names and/or compound operators. */
export type QueryObject = {
  [field: string]: FieldQuery | QueryObject | QueryObject[] | undefined
} & {
  [K in CompoundOperator]?:
    | QueryObject
    | QueryObject[]
    | Record<string, FieldQuery | QueryObject>
}

/**
 * Operator-first form, e.g. `{ $equal: { status: "active" } }`.
 * Any comparison operator may wrap a field map.
 */
export type SwappedOperatorQuery = {
  [K in QueryOperator]?: Record<string, unknown>
}

/**
 * Mongo-style query input accepted by `createPredicate` and `parseQuery`.
 *
 * @example
 * { status: "active", score: { $gte: 10 } }
 * { $and: [{ a: 1 }, { b: 2 }] }
 * { tags: { $elemMatch: { label: "sale" } } }
 */
export type QueryInput =
  | QueryObject
  | SwappedOperatorQuery
  | QueryInput[]

/** Parsed leaf query node. */
export interface ParsedQuery {
  _type: 'query'
  key: string
  op: QueryOperator | '$equal' | '$deepEqual'
  val: unknown
}

/** Parsed compound query node. */
export interface ParsedCompound {
  _type: 'compound'
  op: CompoundOperator
  queries: ParsedNode[]
}

/** Parsed `$elemMatch` query node. */
export interface ParsedElemMatch {
  _type: 'elemMatch'
  key: string[]
  queries: ParsedNode[]
}

export type ParsedNode = ParsedQuery | ParsedCompound | ParsedElemMatch

/** Predicate returned by `createPredicate`. */
export type Predicate<T extends Record<string, unknown> = Record<string, unknown>> = (
  data: T
) => boolean
