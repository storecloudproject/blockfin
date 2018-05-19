/*
 * Creates invites. Since there are 4 additional roles a validator takes we will create 4 invites. And, the respective roles
 * would join the network using the invites.
 */

var ssbKeys = require('ssb-keys')
var ssbClient = require('ssb-client')
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
    if (err) { return; }
    var roles = ['tx-receiver', 'precommitter', 'committer', 'sealer'];
    
    sbot.invite.create(roles.length, function(err, invite) {
        if (err) {
            console.log(err)
            return
        }
        console.log('Invitation created....')
        console.log(invite)
        
        // Create one client for each of the roles and then join the pub server, so it can follow the feeds created by these roles.
   /*     roles.forEach(function(role) {
            var roleKeys = ssbKeys.loadOrCreateSync('.ssb/' + role)
            console.log('Redeeming invitation for ' + role)
            
            ssbClient(roleKeys, {
                host: 'localhost', // Connect to local pub server
                port: 8338,        // Validator port
                key: roleKeys.id,      // optional, defaults to keys.id
                path: '.ssb',      // All config data.   
                caps: {
                        // Standard secret-handshake
                        shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='
                    }
                },
                function (err, roleBot, config) {
                    if (err) { 
                        console.log('Creating client for role ' + role + ' failed: ' + err) 
                    } else {
                        console.log('Using invite for ' + roleKeys.id)
                        roleBot.invite.accept(invite, function (err) {
                            if (err) {
                                console.log('Using invite failed for ' + roleKeys.id)
                                console.log(err)
                            } else {
                                console.log('Using invite succeeded for ' + roleKeys.id) 
                            }
                        })
                    }
                    
            })
        })*/
        
    })
   
  }
)
