/*
 * Joins messagenode Pub servers and subscribe to Messagenodes' feeds.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed'),
      pull = require('pull-stream');

const ssbConfigDir = './.ssb';

let configData = JSON.parse(fs.readFileSync('./validator-config.json')),  
    invitations = JSON.parse(fs.readFileSync('./messagenode-invites.json'));   

const jsonFormatter = {
        type: 'space',
        size: 4
      };

configData.forEach((validatorConfig, index) => {
    const validatorDir = ssbConfigDir + '/v' + (index+1),
          validatorKey = 'secret';

    // Create a feed for messagenode with other roles it can take as messages. The other nodes, when connected to this messagenode,
    // will follow this feed to know its roles.

    const keys = ssbKeys.loadOrCreateSync(validatorDir + '/' + validatorKey)
    console.log(validatorDir);
    console.log(keys);
    
    ssbClient(keys, {
        host: 'localhost', // Connect to local pub server
        port: validatorConfig[validatorKey].port,        // Validator port
        key: keys.id,      // optional, defaults to keys.id
        path: validatorDir,      // All config data.   
        caps: {
            // Standard secret-handshake
            shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='
        }
      },
      function (err, sbot, config) {
            if (err) { console.log(err); return; }
            // Each invitation contains Messagenode's main feed id (user id), which we'll use to get the roles validator plays.
            invitations.forEach((invite) => {
               console.log('Creating user feed stream for ' + invite.messagenode);
                pull(
                      sbot.createUserStream({ id: invite.messagenode }),  // The user ID/feed ID.
                      pull.collect((err, feeds) => { 
                          if (err) {
                              console.log('Getting stream failed for ' + invite.messagenode);
                              console.log(err)
                          } else {
                              console.log('Feed for user ' + invite.messagenode);
                              
                              feeds.forEach((feed) => {
                                  console.log(feed.value.content);
                                  if (feed.value.content.type === 'messagenode:role') {
                                      sbot.publish({
                                          type: 'contact',
                                          contact: feed.value.content.role.feedid,
                                          following: true 
                                        }, function(err, msgs) {
                                            if (err) {
                                                console.log('Following failed for user ' + invite.messagenode);
                                                console.log(err);
                                            } else {
                                                console.log('Messages from: ' + feed.value.content.role.feedid)
                                                console.log(msgs)
                                            }

                                        })  
                                   
                                  }
                            })

                          }

                      })
                    )
            })
        })

})
