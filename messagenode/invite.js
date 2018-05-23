/*
 * Creates invites for each Messagenode. The validators join Messagenodes using the invite code. Each Messagenode generates one invite for each validator.
 * The number of validators is passed as parameter, which defaults to 22.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed');

const ssbConfigDir = './.ssb',
      defaultValidators = 22,
      numberOfValidators = process.argv.length > 2 ? (parseInt(process.argv[2]) || defaultValidators) : defaultValidators;

let configData = JSON.parse(fs.readFileSync('./messagenode-config.json')),  // Array of configurations, once for each Messagenode.
    invitations = [];

const jsonFormatter = {
        type: 'space',
        size: 4
      },
      inviteFile = 'messagenode-invites.json';

// For each Messagenode, load the "secret" key from respective Messagenode folder and then create a client to connect to the 
// respective Messagenode.

configData.forEach((messagenodeConfig, index) => {
    const messagenodeDir = ssbConfigDir + '/m' + (index+1),
          messagenodeKey = 'secret';

    // Create a feed for validator with other roles it can take as messages. The other nodes, when connected to this validator,
    // will follow this feed to know its roles.

    const keys = ssbKeys.loadOrCreateSync(messagenodeDir + '/' + messagenodeKey)
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
            // Create an invite that can be redeemed numberOfValidators times. One validator would redeem each.
            sbot.invite.create(numberOfValidators, function(err, invite) {
                if (err) {
                    console.log('Creating invite failed for ' + messagenodeDir)
                    console.log(err)
                } else {
                    let inviteObj = {messagenode: keys.id, invite: invite, port: messagenodeConfig[messagenodeKey].port}
                    console.log('Invitation generated for ' + messagenodeDir)
                    console.log(inviteObj)
                    invitations.push(inviteObj);
                    // This is probably inefficient, but this action is performed only once.
                    fs.writeFileSync(inviteFile, jsonFormat(invitations, jsonFormatter));
                }
            })
    })

})
