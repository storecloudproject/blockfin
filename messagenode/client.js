var ssbClient = require('ssb-client')
ssbClient(function (err, sbot) {
    if (err) {
        console.log(err);
        return
    }
    console.log('Created')
    
    sbot.publish({
      type: 'post',
      text: 'Hello, world!'
    }, function (err, msg) {
      console.log(msg)
    })
})
