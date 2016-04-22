Query-Predicate
================

Re-write of underscore-query using ES6 and Ramda in an (extreme) point-free style.

This module exports a single `createPredicate` function. This function takes
a mongo-like query and returns a predicate function. This function can then be
used with `R.filter` or `R.find`, etc.

The module parses a wide variety of mongo queries - please see the tests for
examples.

Documentation will be added shortly, but in the meantime check the Documentation
for the query operators for [underscore-query](https://github.com/davidgtonge/underscore-query/blob/master/README.md)
