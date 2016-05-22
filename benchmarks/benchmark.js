/* eslint-disable no-console, dot-location */

const Benchmark = require("benchmark")
const R = require("ramda")

module.exports = function runSuite(spec) {
  const suite = new Benchmark.Suite()

  function addToSuite(fn, name) {
    suite.add(name, fn)
  }

  R.mapObjIndexed(addToSuite, spec)

  // add listeners
  suite.on("cycle", (event) => {
    console.log(String(event.target))
  })
  .on("complete", function complete() {
    console.log("Fastest is " + this.filter("fastest").map("name"))
  })
  .run({ "async": true })
}
