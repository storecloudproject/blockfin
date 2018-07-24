const Crypto = require('../crypto.js');
const Utils = require('../utils.js');
const PubSub = require('pubsub-js');

module.exports = class Validator {
    constructor(id) {
        this.id = id;   // The ID of the validator.
        this.transactionBatches = [];   // Trasaction batches.
        this.transactionQueue = [];     // Queue to store incoming transactions.
        this.keypair = Crypto.generate();   // Each validator needs to sign the transaction batch. 
        this.batchTransactions();
    }
    
    // Getters.
    
    // Print transaction batches.
    get transactionBatcheSize() {
        return this.transactionBatches.length;
    }
    
    // Methods.
    
    // Validate transaction. Currently, we only validate the signature.
    
    validate(signedTransaction) {
        return Crypto.verifySignatureWithPublicKey(signedTransaction);      // True/false.
    }
    
    // Receive a transaction and queue it.
    receive(signedTransaction) {
        if (this.validate(signedTransaction)) {
            this.transactionQueue.push(signedTransaction);   
        }
    }
    
    /* Dequeue any transactions from the transaction queue and build a transaction batch.
     * The transaction batch creates a mini-chain of transactions, create a Merkle root, and signs the merkle root.
     */
    
    dequeue() {
        if (this.transactionQueue.length) {
            let latestTransactions = this.transactionQueue.slice(0);
            this.transactionQueue.length = 0;
            
            latestTransactions = latestTransactions.map((originalTransaction, index) => {
                let transaction = Utils.clone(originalTransaction);    
                if (index > 0) {
                    // Except for the first transaction in the batch, link the current transaction to "previous" transaction 
                    transaction.signatureHash = Crypto.hash(latestTransactions[index-1].signature.concat(latestTransactions[index].signature))
                } else {
                    transaction.signatureHash = Crypto.hash(latestTransactions[index].signature)
                }  
                return transaction;
            })
            
            const merkleTreeOfSignatureHashes = {
                merkleroot: Crypto.merkle(latestTransactions.filter(transaction => transaction.signatureHash)).root()
            }
            
            let batch = {
                signature: Crypto.sign(this.keypair, merkleTreeOfSignatureHashes),
                transactions: latestTransactions
            }
            
            batch.signature.public = this.keypair.public;   // Add the public key used to generate the signature.
            
            this.transactionBatches.push(batch);
            PubSub.publish('transaction-batch', {validator: this.id, batch: batch});
            
            return batch;
        }
        // No new transactions have been received.
        return null;
    }
    
    /*
     * Transactions trickle in every few milliseconds to minutes or hours, but batching waits for a random period and collects all the transactions 
     * received in that duration. Each validator waits for a random duration to simulate asynchrony.
     */
    batchTransactions() {
        let batchIt = () => {
            const b = this.dequeue();
            /*if (b) {
                console.log('Batching for ' + this.id)
                console.log(b.transactions.length)
            }*/
        }

        Utils.interval(batchIt, Utils.randomBetweenMinMax(3000, 6000), undefined);
    }
}