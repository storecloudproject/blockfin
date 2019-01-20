/**
 * Creates the configuration required to setup the Messagenodes. In localhost, each Messagenode is run on a different port and a different config directories
 * are used for SSBC keys and datastore. The Messagenodes can be run on separate host also, in which case .ssb is assumed to the SSBC config directory.
 * Run this tool as:
 * node secrets.js <n> where n is the number of Messagenode required. If n is not specified, a default of 5 is used.
 */
const ssbkeys = require('ssb-keys');
const jsonFormat = require('json-format');
const fs = require('fs');

// Roles that Messagenode can take. The primary key is always called 'secret'.
const roles = ['secret', 'block-producer', 'assembler', 'commit-counter'],
      defaultNumberOfMessagenodes = 5,
      numberOfMessagenodes = process.argv.length > 2 ? (parseInt(process.argv[2]) || defaultNumberOfMessagenodes) : defaultNumberOfMessagenodes,
      startPortNumber = 6000,
      jsonFormatter = {
        type: 'space',
        size: 4
      },
      messagenodeConfigFile = './messagenode-config.json';

var messagenodes = [];

for (let v = 0; v < numberOfMessagenodes; v++) {
    let messagenode = {};
    roles.forEach((role) => {
        messagenode[role] = {keys: ssbkeys.generate(), host: 'localhost', port: (startPortNumber + (v * 2)), wsport: (startPortNumber + (v * 2) + 1) }
    })
    messagenodes.push(messagenode)
}

fs.writeFile(messagenodeConfigFile, jsonFormat(messagenodes, jsonFormatter), function(err){
    if (err) throw err;
    console.log(messagenodeConfigFile + ' saved');
});