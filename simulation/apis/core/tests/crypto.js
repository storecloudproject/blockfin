const Crypto = require('../../crypto.js')

// Verify hash function
console.log('Message hashing:')
console.log(Crypto.hash('Hello world'))

// Create keypair
let keys = Crypto.generate();
console.log('Generated key:')
console.log(keys)

// Sign a message object.
let signed = Crypto.sign(keys, {'source': 'AccountA', 'destination': 'AccountB', 'store': 0.5, 'memo': 'testing'});
console.log('Signature object:')
console.log(signed)

// Verify a signed object.
let verified = Crypto.verify(keys, signed);
console.log('Signature verified:')
console.log(verified)

// Verify explicitly using public key.

signed.public = keys.public;
verified = Crypto.verifySignatureWithPublicKey(signed);
console.log('Signature verified with public key:')
console.log(verified)

// Verify Merkle trees.
const content = ['Love For All, Hatred For None', 'Change the world by being yourself', 'Every moment is a fresh beginning',
              'Never regret anything that made you smile', 'Die with memories, not dreams', 'Aspire to inspire before we expire'],
      contentHash = content.map(c => Crypto.hash(c));

console.log('Creating Merkle tree for:')
console.log(contentHash)

let merkle = Crypto.merkle(contentHash);
console.log('Merkle tree root:')
console.log(merkle.root())

console.log('Merkle tree depth:')
console.log(merkle.depth())

console.log('Merkle tree levels:')
console.log(merkle.levels())

console.log('Merkle tree nodes:')
console.log(merkle.nodes())

for (let l = 0; l < merkle.levels(); l++) {
    console.log('Data at level: ' + l)
    console.log(merkle.level(l))
}