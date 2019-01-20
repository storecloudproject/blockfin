

var tape = require('tape')
var ssbkeys = require('../')

tape('box, unbox', function (t) {

  var alice = ssbkeys.generate()
  var bob = ssbkeys.generate()

  var boxed = ssbkeys.box({okay: true}, [bob.public, alice.public])
  console.log('boxed')
  var msg = ssbkeys.unbox(boxed, alice.private)
  t.deepEqual(msg, {okay: true})
  t.end()
})
