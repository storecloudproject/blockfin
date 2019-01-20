'use strict'
var sodium     = require('chloride')

var pb         = require('private-box')

var u          = require('./util')

var isBuffer = Buffer.isBuffer

//UTILS

function clone (obj) {
  var _obj = {}
  for(var k in obj) {
    if(Object.hasOwnProperty.call(obj, k))
      _obj[k] = obj[k]
  }
  return _obj
}

var hmac = sodium.crypto_auth

exports.hash = u.hash

exports.getTag = u.getTag

function isObject (o) {
  return 'object' === typeof o
}

function isFunction (f) {
  return 'function' === typeof f
}

function isString(s) {
  return 'string' === typeof s
}

var curves = {}
curves.ed25519 = require('./sodium')

function getCurve(keys) {
  var curve = keys.curve

  if(!keys.curve && isString(keys.public))
    keys = keys.public

  if(!curve && isString(keys))
    curve = u.getTag(keys)

  if(!curves[curve]) {
    throw new Error(
      'unkown curve:' + curve +
      ' expected: '+Object.keys(curves)
    )
  }

  return curve
}

//this should return a key pair:
// {curve: curve, public: Buffer, private: Buffer}

exports.generate = function (curve, seed) {
  curve = curve || 'ed25519'

  if(!curves[curve])
    throw new Error('unknown curve:'+curve)

  return u.keysToJSON(curves[curve].generate(seed), curve)
}

//import functions for loading/saving keys from storage
var storage = require('./storage')(exports.generate)
for(var key in storage) exports[key] = storage[key]


exports.loadOrCreate = function (filename, cb) {
  exports.load(filename, function (err, keys) {
    if(!err) return cb(null, keys)
    exports.create(filename, cb)
  })
}

exports.loadOrCreateSync = function (filename) {
  try {
    return exports.loadSync(filename)
  } catch (err) {
    return exports.createSync(filename)
  }
}


//takes a public key and a hash and returns a signature.
//(a signature must be a node buffer)

function sign (keys, msg) {
  if(isString(msg))
    msg = new Buffer(msg)
  if(!isBuffer(msg))
    throw new Error('msg should be buffer')
  var curve = getCurve(keys)

  return curves[curve]
    .sign(u.toBuffer(keys.private || keys), msg)
    .toString('base64')+'.sig.'+curve

}

//takes a public key, signature, and a hash
//and returns true if the signature was valid.
function verify (keys, sig, msg) {
  if(isObject(sig))
    throw new Error('signature should be base64 string, did you mean verifyObj(public, signed_obj)')
  return curves[getCurve(keys)].verify(
    u.toBuffer(keys.public || keys),
    u.toBuffer(sig),
    isBuffer(msg) ? msg : new Buffer(msg)
  )
}

// OTHER CRYTPO FUNCTIONS

exports.signObj = function (keys, hmac_key, obj) {
  if(!obj) obj = hmac_key, hmac_key = null
  var _obj = clone(obj)
  var b = new Buffer(JSON.stringify(_obj, null, 2))
  if(hmac_key) b = hmac(b, u.toBuffer(hmac_key))
  _obj.signature = sign(keys, b)
  return _obj
}

exports.verifyObj = function (keys, hmac_key, obj) {
  if(!obj) obj = hmac_key, hmac_key = null
  obj = clone(obj)
  var sig = obj.signature
  delete obj.signature
  var b = new Buffer(JSON.stringify(obj, null, 2))
  if(hmac_key) b = hmac(b, u.toBuffer(hmac_key))
  return verify(keys, sig, b)
}

exports.box = function (msg, recipients) {
  msg = new Buffer(JSON.stringify(msg))

  recipients = recipients.map(function (keys) {
    return sodium.crypto_sign_ed25519_pk_to_curve25519(u.toBuffer(keys.public || keys))
  })

  return pb.multibox(msg, recipients).toString('base64')+'.box'
}

exports.unbox = function (boxed, keys) {
  boxed = u.toBuffer(boxed)
  var sk = sodium.crypto_sign_ed25519_sk_to_curve25519(u.toBuffer(keys.private || keys))

  var msg = pb.multibox_open(boxed, sk)
  try {
    return JSON.parse(''+msg)
  } catch (_) { }
  return
}


