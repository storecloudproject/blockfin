/*
 * Follow validator feeds.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed'),
      pull = require('pull-stream');

const ssbConfigDir = './.ssb';

let configData = JSON.parse(fs.readFileSync('./messagenode-config.json'));  // Array of configurations, once for each messagenode.
const jsonFormatter = {
        type: 'space',
        size: 4
      };

// For each messagenode, load the "secret" key from respective messagenode folder and then create a client to connect to the 
// respective messagenode node.
configData.forEach((messagenodeConfig, index) => {
    const messagenodeDir = ssbConfigDir + '/m' + (index+1),
          messagenodeKey = 'secret',
          assemblerKey = 'assembler';   // This role is used to assemble the blocks.

    // Create a feed for messagenode with other roles it can take as messages. The other nodes, when connected to this messagenode,
    // will follow this feed to know its roles.

    const keys = ssbKeys.loadOrCreateSync(messagenodeDir + '/' + messagenodeKey);
          
    //console.log(messagenodeDir);
    //console.log(keys);
    
    ssbClient(keys, {
        host: 'localhost', // Connect to local pub server
        port: messagenodeConfig[messagenodeKey].port,        // Validator port
        key: keys.id,      // optional, defaults to keys.id
        path: messagenodeDir,      // All config data.   
        caps: {
            // Standard secret-handshake
            shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='
        }
      },
      function (err, sbot, config) {
            if (err) { console.log(err); return; }
            let transactionsReceived = [];
            const   assemblerKeys = ssbKeys.loadOrCreateSync(messagenodeDir + '/' + assemblerKey),
                    publishBlock = (feed, transactions) => {
                        feed.publish({
                            type: 'messagenode:block',
                            source: 'm-' + index,
                            transactions: transactions
                          }, function (err, msg) { 
                            if (err) {
                                console.log('Publishing assembled block failed for ' + messagenodeDir);
                                console.log(err)
                            } else {
                                console.log('Published assembled block for ' + messagenodeDir);
                                console.log(jsonFormat(msg, jsonFormatter));   
                            }
                        })
                  },
                  feed = ssbFeed(sbot, assemblerKeys);  // Use the assembler role to create the feed.
        
            pull(
                sbot.createLogStream({ live: true }),
                pull.drain((msg) => { 
                    if (msg.value && msg.value.content && msg.value.content.type === 'validator:txn') {
                        // A transaction is received 
                        transactionsReceived.push(msg);
                        if (transactionsReceived.length === 10) {
                            publishBlock(feed, transactionsReceived.slice(0));
                            transactionsReceived.length = 0;
                        }
                    }
                })
            )
    })

})