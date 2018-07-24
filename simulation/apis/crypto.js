const ssbkeys = require('ssb-keys')
const sodium = require('chloride')
const Utils = require('./utils.js')
const Merkle = require('merkle');

module.exports = class Crypto {
    constructor() {
        // Nothing specifically. 
    }
 
    // Generate keypair.
    static generate(seed) {
        // Only 'ed25519' curve is supported for now. Seed optional.
        return ssbkeys.generate('ed25519', seed);
    }

    // Sign the message, which is expected to be a Javascript object. keypair is generated using generate() function.
    static sign(keypair, message) {
        return ssbkeys.signObj(keypair, undefined, message)
    }

    // Verify signature. Returns true if the signatureObject is signed using keypair
    static verify(keypair, signatureObject) {
        return ssbkeys.verifyObj(keypair, undefined, signatureObject)
    }
    
    // Verify the message explicitly using only the public key. The signatureObj contains publicKey and signature itself.
    static verifySignatureWithPublicKey(signatureObj) {
        let cloned = Utils.clone(signatureObj);
        const publicKey = cloned.public;
        delete cloned.public;
        return this.verify({public: publicKey}, cloned);
    }
    
    // Create a SHA256 hash of the data.
    static hash (data, enc) {
        data = ('string' === typeof data && enc == null ? new Buffer(data, 'binary') : new Buffer(data, enc))
        return sodium.crypto_hash_sha256(data).toString('base64') + '.sha256'
    }
    
    // Create a Merkle tree of the content, which must be an array of hashes or signatures.
    static merkle(content) {
        return Merkle('sha256').sync(content);
    }
}
