/*
 * Sets up necessary configurations required to run multiple messagenode instances on localhost. Each node is run on a different port.
 * This should be called only once after running secrets.js to create the secrets for the required number of messagenodes. The configuration is stored in
 * messagenode-config.json file.
 * Each messagenode node is setup under .ssb folder with its own name, as m1, m2, etc. For example: .ssb/m1, .ssb/m2, etc.
 * Under each messagenode folder, the keys and other SSBC configurations are created.
 */

const ssbKeys = require('ssb-keys'),
      fs = require('fs'),
      jsonFormat = require('json-format'),
      exec = require('child_process').exec,
      ssbClient = require('ssb-client'),
      ssbFeed = require('ssb-feed');

const ssbConfigDir = './.ssb';

let configData = JSON.parse(fs.readFileSync('./messagenode-config.json'));  // Array of configurations, once for each messagenode.
const jsonFormatter = {
        type: 'space',
        size: 4
      };

if (!fs.existsSync(ssbConfigDir)) {
    fs.mkdirSync(ssbConfigDir);
}

// Create a folder for each messagenode and create the secret key files for each of the roles the messagenode takes. If this script is run repeatedly,
// it won't recreate the folders and files, if they exist already.
configData.forEach((messagenodeConfig, index) => {
    const messagenodeDir = ssbConfigDir + '/m' + (index+1);
    
    if (!fs.existsSync(messagenodeDir)) {
        // Create the necessary config files only if the folder for messagenode doesn't exist.
        fs.mkdirSync(messagenodeDir);
        
        Object.keys(messagenodeConfig).forEach((role) => {
            const secretFile = messagenodeDir + '/' + role;
            fs.writeFileSync(secretFile, jsonFormat(messagenodeConfig[role].keys, jsonFormatter));
            console.log(secretFile + ' created successfully.')
        })
    }
    const messagenodeKey = 'secret';
    
    console.log('Lauching the messagenode at port ' + messagenodeConfig[messagenodeKey].port);
                                                                         
    exec('./node_modules/.bin/sbot server --port ' + messagenodeConfig[messagenodeKey].port + 
         ' --path ' + messagenodeDir + ' --ws.port ' + messagenodeConfig[messagenodeKey].wsport + 
         ' --allowPrivate true&', (e, stdout, stderr)=> {
        if (e instanceof Error) {
            console.error(e);
            throw e;
        }

        console.log('stdout ', stdout);
        console.log('stderr ', stderr);
    });

})


 