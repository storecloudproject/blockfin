const Account = require('./account.js')
const Utils = require('../utils.js')

/*
 * Represents a group of accounts to ease generating transactions.
 */

module.exports = class AccountGroup {
    constructor(totalAccounts, totalTransactions, pauseBetweenTransactionsInMS) {
        this.totalAccounts = (totalAccounts || 100);  // Total number of accounts/wallets.
        this.totalTransactions = (totalTransactions || 1000);   // Total number of transactions to generate.
        this.pauseBetweenTransactionsInMS = (pauseBetweenTransactionsInMS || 10); // Gap between transactions to simulate real world transaction generation.
        this.accounts = [];
        this.setupAccounts(); 
    }
    
    // Setup the accounts. Keep a track of all the public keys of accounts.
    setupAccounts() {
        for (let a = 0; a < this.totalAccounts; a++) {
            this.accounts.push(new Account('account' + (a+1)));
        }
    }
    
    accountList() {
        return this.accounts.map(account => account.id);   
    }
    
    // List generated transactions by account.
    transactionList(specificAccountId) {
        let transactions = {},
            total = 0,
            accounts = !specificAccountId ? this.accounts : this.accounts.filter(account => account.id === specificAccountId);
        accounts.forEach(account => {
            transactions[account.id] = {
                transactions: account.transactionList,
                count: account.transactionList.length
            }
            total += transactions[account.id].count;
        })
        transactions.total = total;
        
        return transactions;
    }
    
    /*
     * Generate a transactions. Run a loop for this.totalTransactions with an interval of this.pauseBetweenTransactionsInMS.
     * In every turn, pick a random account and have it generate the transaction.
     */
    generateTransactions(validatorGroup) {
        const multiplier = this.totalAccounts;
        
        let pickAccountAndGenerateTransaction = () => {
            // It is possible that from and to are same accounts. It is OK for now.
            const r1 = Math.floor(Math.random() * multiplier),
                  r2 = Math.floor(Math.random() * multiplier);
            const otherAccount = this.accounts[r1].publicKey;
            // Aggregate list of transactions produced by ALL the accounts.
            let transaction = this.accounts[r2].generateTransaction(otherAccount);
            validatorGroup.sprayTransaction(transaction);            
        }
        
        Utils.interval(pickAccountAndGenerateTransaction, this.pauseBetweenTransactionsInMS, this.totalTransactions);
    }
    
}
    