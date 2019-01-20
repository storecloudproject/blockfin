var ssbKeys = require('ssb-keys')
var ssbClient = require('ssb-client')
var keys = ssbKeys.loadOrCreateSync('.ssb/secret')

ssbClient(keys, {
    host: 'localhost', // Connect to local pub server
    port: 8336,        // Messagenode port
    key: keys.id,      // optional, defaults to keys.id
    path: '.ssb',      // All config data.   
    caps: {
        // Standard secret-handshake
        shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='
    }
  },
  function (err, sbot, config) {
    if (err) { return; }
    
    console.log('connected to validator.')
    sbot.friends.hops(function(err, friends) {
        if (err) { console.log('createFriendStream error'); return; }
        console.log(friends)
    })

    sbot.getLatest("@/4AVa+8ij403mbCHSLafUkdpmecf2trxLLO1aiPVTh4=.ed25519", function(err, msg) {
        console.log('Latest Message')
        console.log(msg)
    })
   
  }
)
