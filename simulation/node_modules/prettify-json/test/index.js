var fs = require('fs');
var pathUtil = require('path');

var prettifyJSON = require('../');


describe('test', function() {
  it('test', function() {
    var path = pathUtil.join(__dirname, 'fixture.json');
    var o = require(path);
    var txt = fs.readFileSync(path, 'utf-8');
    txt = txt.replace(/"([^"]+)":/g, '$1:');
    prettifyJSON(o).should.be.equal(txt.trim());
  });
});



