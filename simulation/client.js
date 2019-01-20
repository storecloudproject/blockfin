const cluster = require('cluster');     // Node cluster support

require('dotenv').config();     // Environment variables. Not used for now, but just stake in the ground for configurability.

/*
 * Node client for BlockFin. Sets up Node cluster and API infrastructure so new APIs can be added seamlessly with discoverability.
 */

// This is a bad pattern, but this works well for this case because the node is launched only once.
let client = new class {
    constructor() {
        // Number of Node workers. For simulation, we use only one worker to simplify coordination.
        this.numberOfWorkers = 1; // process.env.CLUSTER_SIZE ? parseInt(process.env.CLUSTER_SIZE) : Math.max(1, require('os').cpus().length/2);
        this.setupClient(); 
    }
    
    setupClient() {
        if (cluster.isMaster) {
            this.setupWorkers();
            
        } else {
            this.setupExpressApp();
        }
    }
    
    setupWorkers() {
        // In master instance, spawn worker nodes.
        for (var w = 0; w < this.numberOfWorkers; w++) {
            cluster.fork();
        }
        console.log('Launched ' + this.numberOfWorkers + ' worker processes.')
        cluster.on('online', function(worker) {
            // For future use.
        });

        cluster.on('exit', function(worker, code, signal) {
            // If a process died abnormally, restart it.
            if (worker.exitedAfterDisconnect !== true && (signal || code !== 0)) {
                cluster.fork();     // Restart worker.
            }
        });
    }
    
    setupExpressApp() {
        // Worker process. Each worker is Express app server.
        const app = require('express')();
        const cookieParser = require('cookie-parser');
        const compression = require('compression');
        const bodyParser = require("body-parser");
        const fs = require('fs');
        const path = require('path');
        const https = require('https');

        app.use(cookieParser());
        // Compress response messages unless explicitly prohibited with X-No-Compression.
        app.use(compression({filter: function(req, res) {
            if (req.headers['X-No-Compression']) {
                return false;
              }
              return compression.filter(req, res);
        }}));

        // Enable POST body parsing.
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        // Handle 304 problem.
        app.disable('etag');

        // API discoverability. New APIs can be added simply by creating new folders under "apis" and creating API endpoints in index.js.
        let recursivelyDiscoverAPIs = (folderName) => {
            fs.readdirSync(folderName).forEach((file) => {
                const fullName = path.join(folderName, file), 
                      stat = fs.lstatSync(fullName);

                if (stat.isDirectory()) {
                    recursivelyDiscoverAPIs(fullName);
                } else if (file.toLowerCase().indexOf('index.js') !== -1) {
                    // index.js is entry point into APIs in that module.
                    let Module = require('./' + fullName);     // Create an instance of the API module. Express App instance is passed.
                    new Module(app);
                }
            });
        }
        recursivelyDiscoverAPIs('apis'); // Start discovery.

        /* Always use secure mode. See https://devcenter.heroku.com/articles/ssl-certificate-self for generating self-signed certificates for local testing.
         * Specifically:
         * 1. openssl genrsa -des3 -passout pass:x -out server.pass.key 2048
         * 2. openssl rsa -passin pass:x -in server.pass.key -out server.key
         * 3. openssl req -new -key server.key -out server.csr and follow the prompts
         * 4. openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt
         */
         
        https.createServer({
          key: fs.readFileSync('server.key'),
          cert: fs.readFileSync('server.crt')
        }, app).listen(8008, function() {
            console.log('Process ' + process.pid + ' is listening to all incoming requests on port 8008.');
        });
        
        module.exports.App = app;
    }
        
}();
