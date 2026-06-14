Query-Predicate
================

Re-write of [underscore-query](https://github.com/davidgtonge/underscore-query) using ES modules, TypeScript, and Ramda in an (extreme) point-free style.

This module exports `createPredicate`, which takes a mongo-like query and returns a predicate function. Use it with `Array.prototype.filter`, Ramda's `R.filter`, `R.find`, and so on.

The module parses a wide variety of mongo queries — see the tests for examples. For operator behaviour, see the [underscore-query README](https://github.com/davidgtonge/underscore-query/blob/master/README.md).

## Installation

```bash
npm install query-predicate
```

The package is **ESM-only** (`"type": "module"`). Import it with:

```ts
import createPredicate from 'query-predicate'
```

## Usage

```ts
import createPredicate, { type QueryInput } from 'query-predicate'

const query: QueryInput = {
  status: 'active',
  score: { $gte: 10 },
  tags: { $elemMatch: { label: 'sale' } },
}

const matches = createPredicate(query)

const results = items.filter(matches)
```

`createPredicate` also exposes sort/filter helpers:

```ts
import createPredicate from 'query-predicate'

const { filterAndSort, filterNoSort } = createPredicate.sortFunctions

const filtered = filterNoSort([{ status: 'active' }], collection)
```

To inspect the parsed query AST without running it:

```ts
import { parseQuery, type ParsedNode } from 'query-predicate'

const ast: ParsedNode[] = parseQuery({ foo: { $gt: 1 } })
```

## TypeScript migration (v2.1)

From v2.1 the package is written in TypeScript and published as compiled ESM in `dist/`.

| Before (v2.0) | After (v2.1) |
|---|---|
| CommonJS (`require`) | ESM (`import`) |
| `src/*.js` shipped directly | `src/*.ts` compiled to `dist/` |
| No type definitions | `.d.ts` via `package.json` `"types"` |
| Default export only | Default export + named type/value exports |

**Build locally**

```bash
npm run build   # tsc → dist/
npm test        # build + mocha (107 tests)
```

**Typing strategy**

- The **public API** (`index.ts`, `types.ts`, `memoize.ts`) is fully type-checked.
- Internal Ramda-heavy modules (`parser`, `operators`, `run-query`, `sort`) use `// @ts-nocheck`. They are point-free pipelines that do not play nicely with strict Ramda typings; behaviour is covered by the existing test suite.

If you are consuming the package, you only need the exported types below — you do not depend on those internal implementation details.

## Exported types

All types below are re-exported from the package entry point:

```ts
import type {
  QueryInput,
  Predicate,
  // ...
} from 'query-predicate'
```

### Query input types

These describe what you can pass to `createPredicate` and `parseQuery`.

| Type | Purpose |
|---|---|
| `QueryInput` | Top-level query: field map, compound query, swapped operator form, or array of queries |
| `QueryObject` | Object keyed by field names and/or `$and` / `$or` / `$not` / `$nor` |
| `FieldQuery` | Value for a single field: scalar, `RegExp`, function, or operator object |
| `FieldOperatorQuery` | Operator conditions on one field, e.g. `{ $gt: 5, $lt: 10 }` |
| `RegexFieldQuery` | Regex with options: `{ $regex: "pat", $options: "i" }` |
| `SwappedOperatorQuery` | Operator-first form: `{ $equal: { status: "active" } }` |
| `QueryScalar` | `string \| number \| boolean \| null \| undefined` |
| `QueryOperator` | Union of all field operators (`$equal`, `$gt`, `$in`, `$elemMatch`, …) |
| `CompoundOperator` | `$and` \| `$or` \| `$not` \| `$nor` |
| `OperatorValueMap` | Maps each operator to its expected value shape (e.g. `$between: [min, max]`) |

`QueryInput` examples:

```ts
// implicit $equal
{ status: 'active' }

// explicit operators
{ score: { $gte: 10, $lt: 100 } }

// compound
{ $and: [{ a: 1 }, { b: 2 }] }

// elemMatch
{ items: { $elemMatch: { qty: { $gt: 0 } } } }

// swapped operator
{ $equal: { status: 'active' } }
```

### Runtime types

| Type | Purpose |
|---|---|
| `Predicate<T>` | `(data: T) => boolean` — return type of `createPredicate` |
| `ParsedNode` | Union of parsed AST node types |
| `ParsedQuery` | Leaf node: `{ _type: 'query', key, op, val }` |
| `ParsedCompound` | Compound node: `{ _type: 'compound', op, queries }` |
| `ParsedElemMatch` | `$elemMatch` node: `{ _type: 'elemMatch', key, queries }` |

### Exported values

| Export | Description |
|---|---|
| `default` (`createPredicate`) | `(query: QueryInput) => Predicate` |
| `parseQuery` | `(query: QueryInput) => ParsedNode[]` |
| `createPredicate.sortFunctions` | `filterAndSort`, `filterNoSort`, `createSortMap`, etc. |

Generic document typing:

```ts
interface Article {
  title: string
  score: number
  tags: { label: string }[]
}

const query: QueryInput = { score: { $gte: 10 } }
const matches = createPredicate<Article>(query)

articles.filter(matches) // Article[]
```

## Why point free

This is an experiment in how much of a non-trivial program can be written in a point-free manner — partly to explore the Ramda API, partly as a challenge.

Currently there are only a few explicit function declarations:

- 3 are needed to allow recursion (a y-combinator rewrite would make those harder to reason about)
- 1 is needed to throw errors

When used well, the style is expressive: `R.pluck("key")` states intent more clearly than a manual `for` loop. Some operators (e.g. `$mod`) become much more verbose in point-free form — see `src/operators.ts` for an example.
