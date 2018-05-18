var ssbkeys = require('ssb-keys')

// Roles a Messagenode can take.
var roles = ['secret', 'block-producer', 'assembler', 'precommit-counter', 'commit-counter', 'seal-counter'];

roles.forEach(function(role) {
  ssbkeys.loadOrCreateSync('.ssb/' + role)
})
