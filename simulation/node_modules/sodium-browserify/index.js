
//only exports browser api. use chloride module
//to get automatic fallbacks!

//load tweetnacl first, so that it works sync, and everything is there.
module.exports = require('sodium-browserify-tweetnacl')

//now load wasm which has to be async, ugh.
var libsodium = require('libsodium-wrappers')
libsodium.ready.then(function (value, what) {
  require('./browser') (libsodium, module.exports)
}).catch(function (err) {
  //escape from promise land, ugh
  setTimeout(function () {
    console.log(err.stack)
    process.exit(1)
  })
})





