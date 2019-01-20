/*
 * Follow Messagenode feeds.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed'),
      pull = require('pull-stream'),
      SHA2 = require("sha2");

const ssbConfigDir = './.ssb';

let configData = JSON.parse(fs.readFileSync('./validator-config.json'));  // Array of configurations, once for each Validator.
const jsonFormatter = {
        type: 'space',
        size: 4
      };

// For each validator, load the "secret" key from respective validator folder and then create a client to connect to the 
// respective validator node.
configData.forEach((validatorConfig, index) => {
    const validatorDir = ssbConfigDir + '/v' + (index+1),
          validatorKey = 'secret',
          committerKey = 'committer';   // This role is used to commit the blocks.

    const keys = ssbKeys.loadOrCreateSync(validatorDir + '/' + validatorKey);
          
    //console.log(validatorDir);
    //console.log(keys);
    
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
            const   committerKeys = ssbKeys.loadOrCreateSync(validatorDir + '/' + committerKey),
                    commitBlock = (feed, block) => {
                        feed.publish({
                            type: 'validator:commit',
                            source: 'v-' + index,
                            block: block
                          }, function (err, msg) { 
                            if (err) {
                                console.log('Publishing committed block failed for ' + validatorDir);
                                console.log(err)
                            } else {
                                console.log('Published committed block for ' + validatorDir);
                                console.log(jsonFormat(msg, jsonFormatter));   
                            }
                        })
                  },
                  feed = ssbFeed(sbot, committerKeys);  // Use the committer role to create the feed.
        
            pull(
                sbot.createLogStream({ live: true }),
                pull.drain((msg) => { 
                    if (msg.value && msg.value.content && msg.value.content.type === 'messagenode:block') {
                        // A assembled block is received 
                        commitBlock(feed, SHA2.SHA_224(JSON.stringify(msg)));
                    }
                })
            )
    })

})