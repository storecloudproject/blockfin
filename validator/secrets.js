/**
 * Creates the configuration required to setup the validator nodes. In localhost, each validator is run on a different port and a different config directories
 * are used for SSBC keys and datastore. The validators can be run on separate host also, in which case .ssb is assumed to the SSBC config directory.
 * Run this tool as:
 * node secrets.js <n> where n is the number of validators required. If n is not specified, a default of 22 is used.
 */
const ssbkeys = require('ssb-keys');
const jsonFormat = require('json-format');
const fs = require('fs');

// Roles that validator node can take. validator is the primary role. The primary key is always called 'secret'.
const roles = ['secret', 'tx-receiver', 'committer'],
      defaultNumberOfValidators = 22,
      numberOfValidators = process.argv.length > 2 ? (parseInt(process.argv[2]) || defaultNumberOfValidators) : defaultNumberOfValidators,
      startPortNumber = 7000,
      jsonFormatter = {
        type: 'space',
        size: 4
      },
      validatorConfigFile = './validator-config.json';

var validators = [];

for (let v = 0; v < numberOfValidators; v++) {
    let validator = {};
    roles.forEach((role) => {
        validator[role] = {keys: ssbkeys.generate(), host: 'localhost', port: (startPortNumber + (v * 2)), wsport: (startPortNumber + (v * 2) + 1) }
    })
    validators.push(validator)
}

fs.writeFile(validatorConfigFile, jsonFormat(validators, jsonFormatter), function(err){
    if (err) throw err;
    console.log(validatorConfigFile + ' saved');
});