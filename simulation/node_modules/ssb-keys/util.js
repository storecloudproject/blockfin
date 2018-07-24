'use strict'
var cl     = require('chloride')

exports.hash = function (data, enc) {
  data = (
    'string' === typeof data && enc == null
  ? new Buffer(data, 'binary')
  : new Buffer(data, enc)
  )
  return cl.crypto_hash_sha256(data).toString('base64')+'.sha256'
}

exports.hasSigil = function hasSigil (s) {
  return /^(@|%|&)/.test(s)
}

function tag (key, tag) {
  if(!tag) throw new Error('no tag for:' + key.toString('base64'))
  return key.toString('base64')+'.' + tag.replace(/^\./, '')
}

exports.keysToJSON = function keysToJSON(keys, curve) {
  curve = (keys.curve || curve)

  var pub = tag(keys.public.toString('base64'), curve)
  return {
    curve: curve,
    public: pub,
    private: keys.private ? tag(keys.private.toString('base64'), curve) : undefined,
    id: '@'+(curve === 'ed25519' ? pub : exports.hash(pub))
  }
}

exports.getTag = function getTag (string) {
  var i = string.indexOf('.')
  return string.substring(i+1)
}

exports.toBuffer = function (buf) {
  if(buf == null) return buf
  if(Buffer.isBuffer(buf)) return buf
  var i = buf.indexOf('.')
  var start = (exports.hasSigil(buf)) ? 1 : 0
  return new Buffer(buf.substring(start, ~i ? i : buf.length), 'base64')
}
