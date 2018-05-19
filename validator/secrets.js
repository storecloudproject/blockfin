var ssbkeys = require('ssb-keys')

// Roles that validator node can take.
var roles = ['secret', 'tx-receiver', 'precommitter', 'committer', 'sealer'];

roles.forEach(function(role) {
  ssbkeys.loadOrCreateSync('.ssb/' + role)
})
