const Crypto = require('../crypto.js');

module.exports = class Account {
    constructor(id) {
        this.id = id;   // The ID of the account.
        this.transactions = [];     // The transactions originated from this account.
        this.keypair = Crypto.generate(); 
    }
    
    // Get public key of this account.
    get publicKey() {
        return this.keypair.public;
    }
    
    get transactionList() {
        return this.transactions;
    }
    
    // Print transactions created by this account.
    get printTransactions() {
        console.log('Account ' + this.id + ':');
        console.log(this.transactions)
    }
    
    // Generate a transaction to the specified account. otherAccount = public key of the other account.
    generateTransaction(otherAccount) {
        const howMuch = Math.random() * 10,
              transactionIndex = this.transactions.length,
              from = Crypto.hash(this.keypair.public),
              to = Crypto.hash(otherAccount);
        
        let signature = Crypto.sign(this.keypair, {
            from: from,
            to: to,
            store: howMuch,
            index: transactionIndex,    // To help identify multiple transactions originated from same account.
            memo: 'Sending ' + howMuch + ' from ' + from + ' to ' + to + ' on ' + (new Date()).toString()
        })
        // Add the public key of sender so anyone can verify the signature.
        signature.public = this.keypair.public;
        this.transactions.push(signature);      
        return signature;
    }
    
}
    