var tape = require('tape')
var ssbkeys = require('../')
var crypto = require('crypto')
var path = '/tmp/ssb-keys_'+Date.now()
var fs = require('fs')

tape('create and load presigil-legacy async', function (t) {

  var keys = ssbkeys.generate('ed25519')
  keys.id = keys.id.substring(1)
  fs.writeFileSync(path, JSON.stringify(keys))

  var k2 = ssbkeys.loadSync(path)
  t.equal(k2.id, '@' + keys.id)
  t.end()

})

tape('create and load presigil-legacy', function (t) {

  var keys = ssbkeys.generate('ed25519')
  keys.id = keys.id.substring(1)
  fs.writeFileSync(path, JSON.stringify(keys))

  ssbkeys.load(path, function (err, k2) {
    if(err) throw err
    t.equal(k2.id, '@' + keys.id)
    t.end()
  })

})

tape('prevent clobbering existing keys', function (t) {

  fs.writeFileSync(path, 'this file intentionally left blank', 'utf8')
  t.throws(function () {
    ssbkeys.createSync(path)
  })
  ssbkeys.create(path, function (err) {
    t.ok(err)
    fs.unlinkSync(path)
    t.end()
  })

})
