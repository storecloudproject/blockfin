/*
 * Follow validator feeds.
 */

var ssbKeys = require('ssb-keys')
var ssbClient = require('ssb-client')
var keys = ssbKeys.loadOrCreateSync('.ssb/secret')
var pull = require('pull-stream')

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
    
    sbot.whoami(function (err, info) {
        console.log('Connected to Messagenode Pub server')
        console.log(info)
        console.log('Following validator feeds')
        
        var feeds = ["@sRipwlhgOMK63ftJRxBHdptzWtlZhdDw/kWxYcOfpss=.ed25519",
                     "@/4AVa+8ij403mbCHSLafUkdpmecf2trxLLO1aiPVTh4=.ed25519"]
        
       sbot.replicate.changes(function(err, events) {
            console.log('replication events:')
            console.log(events)
        })
        
        /*sbot.getLatest("@sRipwlhgOMK63ftJRxBHdptzWtlZhdDw/kWxYcOfpss=.ed25519", function(err, info) {
            console.log(info)
        })*/
        
        /*// stream all messages in all feeds, ordered by publish time
        pull(
            sbot.createFeedStream(),
            pull.collect(function (err, msgs) {
              console.log('Messages available ------- ')
              console.log(msgs)
            })
        )
        */
        /*feeds.forEach(function(feed) {
            sbot.publish({
              type: 'contact',
              contact: feed,
              following: true 
            }, function(err, msgs) {
                console.log('Messages from: ' + feed)
                console.log(msgs)
            })  
        })*/
        
        pull(
          sbot.createLogStream({ live: true }),
          pull.drain(function (msg) { 
            console.log(msg)
          })
        )
    })
   
  }
)
