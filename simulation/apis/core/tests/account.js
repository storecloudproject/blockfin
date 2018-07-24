const Account = require('../account.js')
const Crypto = require('../../crypto.js')

const account1 = new Account('account1');
const account2 = new Account('account2');

console.log('Signed transaction:')
let signedTx = account2.generateTransaction(account1.publicKey)
console.log(signedTx)

console.log('Verify signed transaction:')
console.log(Crypto.verifySignatureWithPublicKey(signedTx))
