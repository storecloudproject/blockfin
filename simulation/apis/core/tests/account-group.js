const AccountGroup = require('../account-group.js')
const Utils = require('../../utils.js')

const group = new AccountGroup(10, 50, 10);
console.log('Number of accounts created:')
console.log(group.numberOfAccounts);

group.generateTransactions();

let callback = () => {
    console.log('Number of transactions:')
    console.log(group.printTransactions)
}

Utils.interval(callback, 10000, 1)
