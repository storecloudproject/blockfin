/*
 * Join a Pub server and then create feeds for each of the roles.
 */

var ssbKeys = require('ssb-keys')
var ssbClient = require('ssb-client')
var ssbFeed = require('ssb-feed')

var keys = ssbKeys.loadOrCreateSync('.ssb/secret')

ssbClient(keys, {
    host: 'localhost', // Connect to local pub server
    port: 8338,        // Validator port
    key: keys.id,      // optional, defaults to keys.id
    path: '.ssb',      // All config data.   
    caps: {
        // Standard secret-handshake
        shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='
    }
  },
  function (err, sbot, config) {
    if (err) { console.log(err); return; }
    var roles = ['precommitter']; //['tx-receiver', 'precommitter', 'committer', 'sealer'];
    
    // Follow Messagenode. Required only once.
    /*sbot.publish({
      type: 'contact',
      contact: '@WNNcWwdgmWdrhTNZcRstQKj0Oi0cnYurcTliGBLi4FY=.ed25519',
      following: true 
    }, function(err, msgs) {
        console.log('Messages from Messagenode:')
        console.log(msgs)
    })*/ 
    
    sbot.replicate.changes(function(err, events) {
        console.log('replication events:')
        console.log(events)
    })
       
    /*for (var n = 0; n < 100; n++) {
        sbot.publish({
                type: 'post',
                text: ('hello world, I am primary validator feed. Index: ' + n)
              }, 
                function (err, msg) { 
                //console.log(' Published: ')
                //console.log(msg)
        }) 
    }*/
    
    // Create one feed for each roles.
    roles.forEach(function(role) {
        var roleKeys = ssbKeys.loadOrCreateSync('.ssb/' + role)
        console.log('Creating feed for for ' + role)

        var feed = ssbFeed(sbot, roleKeys)

        // Post to the created feed
        for (var n = 0; n < 2; n++) {
            feed.publish({
                type: 'post',
                text: ('Hi world, I am ' + role + '. Index: ' + n)
              }, 
                function (err, msg) { 
                console.log(' Published: ')
                console.log(msg)
            })    
        }
        

    })
        
  }
)
