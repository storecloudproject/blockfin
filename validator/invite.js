/*
 * Creates invites for each validator node. The Messagenodes join validators using the invite code. Each validator generates one invite for each Messagenode.
 * The number of messagenodes is passed as parameter, which defaults to 5.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed');

const ssbConfigDir = './.ssb',
      defaultMessagenodes = 5,
      numberOfMessagenodes = process.argv.length > 2 ? (parseInt(process.argv[2]) || defaultMessagenodes) : defaultMessagenodes;

let configData = JSON.parse(fs.readFileSync('./validator-config.json')),  // Array of configurations, once for each validator.
    invitations = [];

const jsonFormatter = {
        type: 'space',
        size: 4
      },
      inviteFile = 'validator-invites.json';

// For each validator, load the "secret" key from respective validator folder and then create a client to connect to the 
// respective validator node.
configData.forEach((validatorConfig, index) => {
    const validatorDir = ssbConfigDir + '/v' + (index+1),
          validatorKey = 'secret';

    // Create a feed for validator with other roles it can take as messages. The other nodes, when connected to this validator,
    // will follow this feed to know its roles.

    const keys = ssbKeys.loadOrCreateSync(validatorDir + '/' + validatorKey)
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
            // Create an invite that can be redeemed numberOfMessagenodes times. One Messagenode would redeem each.
            sbot.invite.create(numberOfMessagenodes, function(err, invite) {
                if (err) {
                    console.log('Creating invite failed for ' + validatorDir)
                    console.log(err)
                } else {
                    let inviteObj = {validator: keys.id, invite: invite, port: validatorConfig[validatorKey].port}
                    console.log('Invitation generated for ' + validatorDir)
                    console.log(inviteObj)
                    invitations.push(inviteObj);
                    // This is probably inefficient, but this action is performed only once.
                    fs.writeFileSync(inviteFile, jsonFormat(invitations, jsonFormatter));
                }
            })
    })

})
