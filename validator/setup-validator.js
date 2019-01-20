/*
 * Sets up necessary configurations required to run multiple validator instances on localhost. Each node is run on a different port.
 * This should be called only once after running secrets.js to create the secrets for the required number of validators. The configuration is stored in
 * validator-config.json file.
 * Each validator node is setup under .ssb folder with its own name, as v1, v2, etc. For example: .ssb/v1, .ssb/v2, etc.
 * Under each validator folder, the keys and other SSBC configurations are created.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      exec = require('child_process').exec,
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed');

const ssbConfigDir = './.ssb';

let configData = JSON.parse(fs.readFileSync('./validator-config.json'));  // Array of configurations, once for each validator.
const jsonFormatter = {
        type: 'space',
        size: 4
      };

if (!fs.existsSync(ssbConfigDir)) {
    fs.mkdirSync(ssbConfigDir);
}

// Create a folder for each validator and create the secret key files for each of the roles the validator takes. If this script is run repeatedly,
// it won't recreate the folders and files, if they exist already.
configData.forEach((validatorConfig, index) => {
    const validatorDir = ssbConfigDir + '/v' + (index+1);
    
    if (!fs.existsSync(validatorDir)) {
        // Create the necessary config files only if the folder for validator doesn't exist.
        fs.mkdirSync(validatorDir);
        
        Object.keys(validatorConfig).forEach((role) => {
            const secretFile = validatorDir + '/' + role;
            fs.writeFileSync(secretFile, jsonFormat(validatorConfig[role].keys, jsonFormatter));
            console.log(secretFile + ' created successfully.')
        })
    }
    const validatorKey = 'secret';
    
    console.log('Lauching the validator node at port ' + validatorConfig[validatorKey].port);
                                                                         
    exec('./node_modules/.bin/sbot server --port ' + validatorConfig[validatorKey].port + 
         ' --path ' + validatorDir + ' --ws.port ' + validatorConfig[validatorKey].wsport + 
         ' --allowPrivate true&', (e, stdout, stderr)=> {
        if (e instanceof Error) {
            console.error(e);
            throw e;
        }

        console.log('stdout ', stdout);
        console.log('stderr ', stderr);
    });

})


 