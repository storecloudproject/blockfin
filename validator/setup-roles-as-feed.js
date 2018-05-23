/*
 * Sets up the roles a validator can take as validator's primary feed. This should be called once AFTER setup-validator is invoked.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed');

const ssbConfigDir = './.ssb';

let configData = JSON.parse(fs.readFileSync('./validator-config.json'));  // Array of configurations, once for each validator.
const jsonFormatter = {
        type: 'space',
        size: 4
      };

// For each validator, load the "secret" key from respective validator folder and then create a client to connect to the 
// respective validator node.
configData.forEach((validatorConfig, index) => {
    const validatorDir = ssbConfigDir + '/v' + (index+1),
          validatorKey = 'secret';

    // Create a feed for validator with other roles it can take as messages. The other nodes, when connected to this validator,
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
            Object.keys(validatorConfig).forEach((role) => {
                if (role !== validatorKey) {
                    sbot.publish({
                        type: 'validator:role',
                        role: {
                            name: role,
                            feedid: validatorConfig[role].keys.id
                        }
                      }, 
                        function (err, msg) { 
                            console.log(' Published role as feed for ' + validatorDir + ', ' + role);
                            console.log(msg.value.content.role)
                    })
                }

        })
    })

})


 