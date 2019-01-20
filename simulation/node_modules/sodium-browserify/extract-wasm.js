
var rx =  /data:/ //\/octet-stream/
module.exports = function (string) {
//  console.log(string)

  var i = string.indexOf('"data:application/octet-stream;base64,')
  i = string.indexOf('"data:application/octet-stream;base64,',i+1)
  var j = string.indexOf('"', i+1)
  return string.substring(i, j+1)
}

if(!module.parent)
  console.log(module.exports(require('fs').readFileSync(require.resolve('libsodium'), 'utf8')))








