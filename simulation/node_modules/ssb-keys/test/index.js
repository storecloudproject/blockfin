var tape = require('tape')
var ssbkeys = require('../')
var crypto = require('crypto')
var path = '/tmp/ssb-keys_'+Date.now()

tape('create and load async', function (t) {
  console.log(ssbkeys)
  ssbkeys.create(path, function(err, k1) {
    if (err) throw err
    ssbkeys.load(path, function(err, k2) {
      if (err) throw err
      console.log(k1, k2)
      t.equal(k1.id.toString('hex'), k2.id.toString('hex'))
      t.equal(k1.private.toString('hex'), k2.private.toString('hex'))
      t.equal(k1.public.toString('hex'), k2.public.toString('hex'))
      t.end()
    })
  })
})

tape('create and load sync', function (t) {
  var k1 = ssbkeys.createSync(path+'1')
  var k2 = ssbkeys.loadSync(path+'1')
  t.equal(k1.id.toString('hex'), k2.id.toString('hex'))
  t.equal(k1.private.toString('hex'), k2.private.toString('hex'))
  t.equal(k1.public.toString('hex'), k2.public.toString('hex'))
  t.end()
})

tape('sign and verify a javascript object', function (t) {

  var obj = require('../package.json')

  console.log(obj)

  var keys = ssbkeys.generate()
  var sig = ssbkeys.signObj(keys.private, obj)
  console.log(sig)
  t.ok(sig)
  t.ok(ssbkeys.verifyObj(keys, sig))
  t.ok(ssbkeys.verifyObj({public: keys.public}, sig))
  t.end()

})

//allow sign and verify to also take a separate key
//so that we can create signatures that cannot be used in other places.
//(i.e. testnet) avoiding chosen protocol attacks.
tape('sign and verify a hmaced object javascript object', function (t) {

  var obj = require('../package.json')
  var hmac_key = crypto.randomBytes(32)
  var hmac_key2 = crypto.randomBytes(32)

  var keys = ssbkeys.generate()
  var sig = ssbkeys.signObj(keys.private, hmac_key, obj)
  console.log(sig)
  t.ok(sig)
  //verify must be passed the key to correctly verify
  t.notOk(ssbkeys.verifyObj(keys, sig))
  t.notOk(ssbkeys.verifyObj({public: keys.public}, sig))
  t.ok(ssbkeys.verifyObj(keys, hmac_key, sig))
  t.ok(ssbkeys.verifyObj({public: keys.public}, hmac_key, sig))
  //a different hmac_key fails to verify
  t.notOk(ssbkeys.verifyObj(keys, hmac_key2, sig))
  t.notOk(ssbkeys.verifyObj({public: keys.public}, hmac_key2, sig))

  //assert that hmac_key may also be passed as base64

  hmac_key = hmac_key.toString('base64')
  hmac_key2 = hmac_key2.toString('base64')

  var keys = ssbkeys.generate()
  var sig = ssbkeys.signObj(keys.private, hmac_key, obj)
  console.log(sig)
  t.ok(sig)
  //verify must be passed the key to correctly verify
  t.notOk(ssbkeys.verifyObj(keys, sig))
  t.notOk(ssbkeys.verifyObj({public: keys.public}, sig))
  t.ok(ssbkeys.verifyObj(keys, hmac_key, sig))
  t.ok(ssbkeys.verifyObj({public: keys.public}, hmac_key, sig))
  //a different hmac_key fails to verify
  t.notOk(ssbkeys.verifyObj(keys, hmac_key2, sig))
  t.notOk(ssbkeys.verifyObj({public: keys.public}, hmac_key2, sig))

  t.end()

})

tape('seeded keys, ed25519', function (t) {

  var seed = crypto.randomBytes(32)
  var k1 = ssbkeys.generate('ed25519', seed)
  var k2 = ssbkeys.generate('ed25519', seed)

  t.deepEqual(k1, k2)

  t.end()

})

tape('ed25519 id === "@" ++ pubkey', function (t) {

  var keys = ssbkeys.generate('ed25519')
  t.equal(keys.id, '@' + keys.public)

  t.end()

})













