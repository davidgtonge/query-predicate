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

### Why Point Free

This is an experiment in how much of a non-trivial program can be written in a
point-free manner. I wrote it partly to explore the `ramda` api and partly
as a challenge.

Currently there are only 4 function declarations.

 - 3 are needed to allow recursion. While I probably could re-write the
 functions to use a y-combinator, I've not yet got round to it. The place that
 the recursion is used would make those particular functions a lot harder to
 reason about
 - 1 is needed to throw errors

I think when used well by people with familiar with functional apis (such as
Ramda), the style is very expressive. At a simple level a procedural for loop
could be used for `map` or `filter` or `reduce`. By using `map` rather than
a for loop, the intent of my program is easier to understand.

Here is an example of the journey from procedural to point free

#### Simple Procedural
```
function fn(input) {
  var output = []
  for (i = 0; i < input.length; i++) {
      output.push(input[i].key)
  }
  return output
}
```

#### Using Native Map
```
function fn(input) {
  return input.map(function(item) {
      return item.key
  })
}
```

#### Using FP Style Map
```
function fn(input){
  return map(function(item) {
    return item.key
  }, input)
}
```

#### Making Point free - part 1 (i.e. no arguments)
This works
```
var fn = R.map(function(item) {
  return item.key
})
```

#### Making Point free - part 2 - Using R.prop
```
var fn = R.map(R.prop("key"))
```

#### Using R.pluck
```
var fn = R.pluck("key")
```

### Where doesn't it work

Some functions become a lot more verbose and less clear. For example:
```
function $mod(value, attr){
  return attr % value[0] === value[1]
}

```
becomes:

```
const $mod = R.converge(R.identical, [
  R.converge(R.modulo, [R.nthArg(1), R.compose(R.head, R.nthArg(0))]),
  R.compose(R.last, R.nthArg(0))
])
```
