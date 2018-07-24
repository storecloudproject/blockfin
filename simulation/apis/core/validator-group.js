const Validator = require('./validator.js')
const Utils = require('../utils.js')

/*
 * Represents a group of validators to ease generating transaction batches and simulate validators receiving and handling transactions from clients.
 */

module.exports = class ValidatorGroup {
    constructor(totalValidators) {
        this.totalValidators = (totalValidators || 61);  // Total number of validators. Defaults to allow for 20 Byzantine validators.
        this.validators = [];
        this.setupValidators(); 
    }
    
    // Setup the validators. 
    setupValidators() {
        for (let v = 0; v < this.totalValidators; v++) {
            this.validators.push(new Validator('validator' + (v+1)));
        }
    }
    
    get numberOfValidators() {
        return this.validators.length;   
    }
    
    // List of transaction batches by validators.
    transactionBatches(specificValidatorId) {
        let transactionBatches = {},
            total = 0,
            validators = !specificValidatorId ? this.validators : this.validators.filter(v => v.id === specificValidatorId);
        
        validators.forEach(v => {
            transactionBatches[v.id] = {
                transactionBatches: v.transactionBatches,
                count: v.transactionBatches.length
            }
            total += transactionBatches[v.id].count;
        })
        transactionBatches.total = total;
        
        return transactionBatches;
    }
    
    /*
     * As transactions are created by different accounts, they are randomly sent to different validators, so they can process them.
     */
    sprayTransaction(signedTransaction) {
        const multiplier = this.totalValidators,
              r = Math.floor(Math.random() * multiplier);
        
        this.validators[r].receive(signedTransaction);      // Send the transaction to a random validator.
    }
    
}
    