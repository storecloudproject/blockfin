
var sodium = require('./index')

var fail = require('chloride-test')(sodium).fail

if(fail) process.exit(fail)

//run again, after libsodium wasm has had time to load
setTimeout(function () {
  process.exit(require('chloride-test')(sodium).fail)
}, 200)



