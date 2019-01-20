const MessageNode = require('./messagenode.js');
const Utils = require('../utils.js');
const PubSub = require('pubsub-js');
const Config = require('../config.js')

/*
 * Represents a group of message nodes to ease collecting transaction batches and simulate message nodes assembling the blocks in blockchain.
 */

module.exports = class MessageNodeGroup {
    constructor(totalMessageNodes) {
        this.totalMessageNodes = (totalMessageNodes || 16);  // Total number of message nodes. Defaults to allow for 5 Byzantine message nodes.
        Config.network.totalMessageNodes = this.totalMessageNodes;
        this.messageNodes = [];
        this.setupMessageNodes(); 
    }
    
    // Setup the messageNodes. 
    setupMessageNodes() {
        let that = this;
        for (let m = 0; m < this.totalMessageNodes; m++) {
            let messageNode = new MessageNode('messageNode' + (m+1));
            Config.addMessageNodeKey(messageNode.identifier);
            this.messageNodes.push(messageNode);
        }
        PubSub.subscribe('transaction-batch', (msg, data) => {
            that.sprayTransactionBatches(data);
        })
    }
    
    get numberOfMessageNodes() {
        return this.messageNodes.length;   
    }
    
    // List of transaction batches by messageNodes.
    transactionBatches(specificMessageNodeId) {
        let transactionBatches = {},
            total = 0,
            messageNodes = !specificMessageNodeId ? this.messageNodes : this.messageNodes.filter(m => m.id === specificMessageNodeId);
        
        messageNodes.forEach(m => {
            transactionBatches[m.id] = {
                transactionBatches: m.transactionBatches,
                count: m.transactionBatches.length
            }
            total += transactionBatches[m.id].count;
        })
        transactionBatches.total = total;
        
        return transactionBatches;
    }
    
    /*
     * As transaction batches are created by validators, they publish their batches, which are randomly sent to between 2-5 message nodes.
     * This models validator nodes sending their batches to a small subset of connected message nodes.
     */
    sprayTransactionBatches(signedTransactionBatch) {
        let r = Utils.randomBetweenMinMax(2,5);
        let alreadyUsedMessageNodes = [];   // Just to ensure that we don't randomly pick the same message node multiple times.
        
        while (r > 0) {
            let messageNode = this.messageNodes[Math.floor(Math.random() * this.totalMessageNodes)];
            if (alreadyUsedMessageNodes.indexOf(messageNode.id) === -1) {
                alreadyUsedMessageNodes.push(messageNode.id);
                messageNode.receive(signedTransactionBatch);
                r -= 1;
            }
        }
    }
    
}
    