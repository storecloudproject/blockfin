'use strict'
var u = require('./util')

function isFunction (f) {
  return 'function' == typeof f
}

module.exports = function (generate) {

  function create (filename, curve, legacy) {
    var keys = generate(curve, legacy)
    localStorage[filename] = JSON.stringify(keys)
    return keys
  }

  function load (filename) {
    return JSON.parse(localStorage[filename])
  }

  return {
    createSync: create,
    create: function(filename, curve, legacy, cb) {
      if(isFunction(legacy))
        cb = legacy, legacy = null
      if(isFunction(curve))
        cb = curve, curve = null
      cb(null, create(filename, curve, legacy))
    },
    loadSync: load,
    load: function (filename, cb) {
      cb(null, load(filename))
    }
  }

}


