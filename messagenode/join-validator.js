/*
 * Joins validator Pub server.
 */

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
    
    sbot.whoami(function (err, info) {
        console.log('Connected to Messagenode Pub server')
        console.log(info)
        console.log('Redeeming invitation to connect to Validator')
        var invite = '192.168.1.2:8338:@sRipwlhgOMK63ftJRxBHdptzWtlZhdDw/kWxYcOfpss=.ed25519~LfvLWl1uxEZwc+vBezSC5+hj8xOj1hflRM9kEChZRFI='
        sbot.invite.accept(invite, function (err) {
            if (err) {
                console.log('Using invite failed for ' + keys.id)
                console.log(err)
            } else {
                console.log('Using invite succeeded for ' + keys.id) 
            }
        })
    })
   
  }
)
