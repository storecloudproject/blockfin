/*
 * Sets up the roles a messagenode can take as messagenode's primary feed. This should be called once AFTER setup-messagenode is invoked.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed');

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
          messagenodeKey = 'secret';

    // Create a feed for messagenode with other roles it can take as messages. The other nodes, when connected to this messagenode,
    // will follow this feed to know its roles.

    const keys = ssbKeys.loadOrCreateSync(messagenodeDir + '/' + messagenodeKey)
    console.log(messagenodeDir);
    console.log(keys);
    
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
            Object.keys(messagenodeConfig).forEach((role) => {
                if (role !== messagenodeKey) {
                    sbot.publish({
                        type: 'messagenode:role',
                        role: {
                            name: role,
                            feedid: messagenodeConfig[role].keys.id
                        }
                      }, 
                        function (err, msg) { 
                            console.log(' Published role as feed for ' + messagenodeDir + ', ' + role);
                            console.log(msg.value.content.role)
                    })
                }

        })
    })

})


 