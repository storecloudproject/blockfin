/*
 * Creates transactions. This module creates a SSB client for each validator and then creates N transactions, one every 100 ms.
 * N defaults to 10, but it can be passed as a command line parameter. It is assumed that the validator nodes are already running as:
 * node setup-validator.js
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed');

const ssbConfigDir = './.ssb',
      defaultTransactions = 10,
      numberOfTransactions = process.argv.length > 2 ? (parseInt(process.argv[2]) || defaultTransactions) : defaultTransactions;

let configData = JSON.parse(fs.readFileSync('./validator-config.json'));  // Array of configurations, once for each validator.
const jsonFormatter = {
        type: 'space',
        size: 4
      },
      numberOfValidators = configData.length;

// For each validator, load the "secret" key from respective validator folder and then create a client to connect to the 
// respective validator node. Then create the transaction feed for each validator using tx-receiver role.
configData.forEach((validatorConfig, index) => {
    const validatorDir = ssbConfigDir + '/v' + (index+1),
          validatorKey = 'secret',
          txReceiverKey = 'tx-receiver';

    const keys = ssbKeys.loadOrCreateSync(validatorDir + '/' + validatorKey)
    // Connect to the respective validator node.
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
        const txReceiverSecrets = ssbKeys.loadOrCreateSync(validatorDir + '/' + txReceiverKey),
              feed = ssbFeed(sbot, txReceiverSecrets);

        for (let t = 0; t < numberOfTransactions; t++) {
            (function(n) {
                setTimeout(function(){
                    feed.publish({
                        type: 'validator:txn',
                        source: 'v' + index,
                        dest: 'v' + (index >= (numberOfValidators-1) ? 1 : index+1),
                        qty: Math.floor(Math.random() * 100)
                      }, function (err, msg) { 
                        console.log('Published Transaction: ');
                        console.log(jsonFormat(msg, jsonFormatter));
                    })
                }, 100);
            }(t));
        }

      })
   
})


 