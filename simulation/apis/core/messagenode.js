const Crypto = require('../crypto.js');
const Utils = require('../utils.js');

module.exports = class MessageNode {
    constructor(id) {
        this.id = id;   // The ID of the message node.
        this.transactionBatches = [];   // Trasaction batches, this message node received from connected validators.
        this.blockchain = [];     // The blockchain itself.
        this.keypair = Crypto.generate();   // Each message node needs to sign the blocks. 
        this.gossip();
    }
        
    // Print transaction batches.
    get transactionBatcheSize() {
        return this.transactionBatches.length;
    }
    
    // Methods.
    
    // Validate transaction batches. Currently, we only validate the signature.
    
    validate(signedTransactionBatch) {
        return Crypto.verifySignatureWithPublicKey(signedTransactionBatch.batch.signature);      // True/false.
    }
    
    // Receive a transaction batch and queue it.
    receive(signedTransactionBatch) {
        console.log(signedTransactionBatch)

        if (this.validate(signedTransactionBatch)) {
            this.transactionBatches.push(signedTransactionBatch);   
        } else {
            console.log('Signature verification failed:')
            console.log(signedTransactionBatch)
        }
    }
    
    /*
     * Transactions trickle in every few milliseconds to minutes or hours, but batching waits for a random period and collects all the transactions 
     * received in that duration. Each validator waits for a random duration to simulate asynchrony.
     */
    gossip() {
        
    }
}