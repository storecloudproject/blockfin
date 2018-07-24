const PubSub = require('pubsub-js');
const Utils = require('../../utils.js')
const Crypto = require('../../crypto.js')
const prettifyJSON = require('prettify-json');

/*
 * While in _ARB_STAGE, new transaction batches are accepted into INPUT_received buffer.
 * At the end of _ARB_STAGE, INPUT_received buffer is emptied into GOSSIP_received, until the nodes reach consistency.
 */
class MessageNode {
    constructor(id, N, f, messageNodeGroup) {
        this.id = id;
        this.N = N;
        this.f = f;
        this.messageNodeGroup = messageNodeGroup;
        
        // messages we are intersted in.
        this.INPUT_received = [];   // Input received from validators.
        this.GOSSIP_received = {};  // Nodes gossiped and  shared each other's transaction sets.
        this.ARB_received = {};     // Nodes ARB'd.
        this.VECTOR_received = {};  // Vector consensus.
        
        this.GOSSIP_noChange = 0;
        this.GOSSIP_Change = 0;
        
        // Various stages of ARB.
        this._INPUT_STAGE = 0;
        this._GOSSIP_STAGE = 1;
        this._ARB_STAGE = 2;
        this._VECTOR_STAGE = 3;
        
        this.currentStage = this._INPUT_STAGE;
        const that = this;
        PubSub.subscribe('INPUT', (msg, data) => {
            // Transaction batches coming from validators. data = transaction batch.
            that.processINPUTMessage(data);
        })
        PubSub.subscribe('GOSSIP:TXNBATCH:'+this.id, (msg, data) => {
            // The gossip messages from other message nodes. data is a list of transaction batches.
            that.processGOSSIPMessage(data);
        })
        
        PubSub.subscribe('GOSSIP:ARB:'+this.id, (msg, data) => {
            // The gossip messages from other message nodes. data is a list of message nodes and their transaction batches.
            that.processARBMessage(data);
        })
        
        PubSub.subscribe('GOSSIP:VECTOR:'+this.id, (msg, data) => {
            // The agreed messages from other message nodes. data is a list of message nodes and their agreed upon hashes and supporting vectors.
            that.processVectorMessage(data);
        })
    }
    
    get nodeId() {
        return this.id;    
    }
    
    // Process transaction batches.
    processINPUTMessage(data) {
        if (data.node === this.id) {
            this.INPUT_received.push(data);
        }
    }
    
    // Models reliable broadcast primitive
    reliableBroadcast(messageType, value) {
        PubSub.publish(messageType, value);
    }
    
    processGOSSIPMessage(data) {
        if (this.currentStage === this._ARB_STAGE) {return;}
        
        data = Array.isArray(data) ? data : [data];
        const that = this;
        const beforeStatus = this.checkGossipProgress();

        // transactionBatch will be of the form { node: "M0", transactions: {"M0-V0": ["T0", "T1", "T2" ], . . . } }
        
        data.forEach(transactionBatch => {
            if (!that.GOSSIP_received[transactionBatch.node]) {
                that.GOSSIP_received[transactionBatch.node] = {};
            }
            Object.keys(transactionBatch.transactions).forEach(validator => {
                that.GOSSIP_received[transactionBatch.node][validator] = transactionBatch.transactions[validator];
            }) 
        })
        const afterStatus = this.checkGossipProgress();
        
        if (beforeStatus.totalMessageNodes === afterStatus.totalMessageNodes && beforeStatus.totalTransactionBatches === afterStatus.totalTransactionBatches) {
            this.GOSSIP_noChange += 1;
            if (afterStatus.totalMessageNodes >= this.N) {
                /*console.log('============== Gossip COMPLETED: ' + this.nodeId + ': ' + (new Date()).getTime())
                console.log(prettifyJSON(this.GOSSIP_received))
                console.log('==============')*/
                
                // console.log(Object.keys(this.GOSSIP_received).length + ' Changes: ' + this.GOSSIP_Change + ', no change: ' + this.GOSSIP_noChange)
                
                this.multiValueConsensus();
            }
        } else {
            let newDataForGossip = [];
            Object.keys(that.GOSSIP_received).forEach(mNodeId => {
                newDataForGossip.push({node: mNodeId, transactions: that.GOSSIP_received[mNodeId]});
                //console.log('Re-gossiping at ' + mNodeId)
                //console.log(txnBatch)
            })
            this.GOSSIP_Change += 1;
            that.gossip('TXNBATCH', newDataForGossip)
        }
    }
    
    checkGossipProgress() {
        let gossipKeys = Object.keys(this.GOSSIP_received), totalTransactionBatches = 0, totalMessageNodes = gossipKeys.length;
        const that = this;
        gossipKeys.forEach(mNode => {
            totalTransactionBatches += Object.keys(that.GOSSIP_received[mNode]).length;
        })
        return {totalMessageNodes: totalMessageNodes, totalTransactionBatches: totalTransactionBatches};
    }
    
    checkARBProgress() {
        let arbMessageSources = Object.keys(this.ARB_received), // Source message nodes that gossipped.
            hashAgreedByMajority = null,  // At least (N -f) sources must report the same value.
            totalARBSources = arbMessageSources.length,
            transactionSetsPerSource = [];
        
        const that = this;
        
        if (totalARBSources > (this.N - this.f)) {
            let hashCounter = {};
            arbMessageSources.forEach(source => {
                if (hashCounter[that.ARB_received[source].hash] === undefined) {
                    hashCounter[that.ARB_received[source].hash] = 1;
                } else {
                    hashCounter[that.ARB_received[source].hash] += 1;
                }
            })
            const hashCounterKeys = Object.keys(hashCounter),
                  minAgreement = (this.N - 2*this.f);
            
            for (let h = 0; h < hashCounterKeys.length; h++) {
                if (hashCounter[hashCounterKeys[h]] > minAgreement) {
                    hashAgreedByMajority = hashCounterKeys[h];
                    break;
                }
            }
        }
        
        return {hashAgreedByMajority: hashAgreedByMajority, totalARBSources: totalARBSources};
    }
    
    checkVectorProgress() {
        let arbMessageSources = Object.keys(this.ARB_received), // Source message nodes that gossipped.
            hashAgreedByMajority = null,  // At least (N -f) sources must report the same value.
            totalARBSources = arbMessageSources.length,
            transactionSetsPerSource = [];
        
        const that = this;
        
        if (totalARBSources > (this.N - this.f)) {
            let hashCounter = {};
            arbMessageSources.forEach(source => {
                if (hashCounter[that.ARB_received[source].hash] === undefined) {
                    hashCounter[that.ARB_received[source].hash] = 1;
                } else {
                    hashCounter[that.ARB_received[source].hash] += 1;
                }
            })
            const hashCounterKeys = Object.keys(hashCounter),
                  minAgreement = (this.N - 2*this.f);
            
            for (let h = 0; h < hashCounterKeys.length; h++) {
                if (hashCounter[hashCounterKeys[h]] > minAgreement) {
                    hashAgreedByMajority = hashCounterKeys[h];
                    break;
                }
            }
        }
        
        return {hashAgreedByMajority: hashAgreedByMajority, totalARBSources: totalARBSources};
    }
    
    
    // gossippedMessages = list of transaction batches, consensusId = Id for this round of consensus.
    multiValueConsensus() {
        this.currentStage = this._ARB_STAGE;
        let gossippedMessages = JSON.parse(JSON.stringify(this.GOSSIP_received));
        this.GOSSIP_received = {};
        
        this.beginConsensus(this.prepareARBMessage(gossippedMessages));
    }
    
    vectorConsensus(agreedHash) {
        this.currentStage = this._VECTOR_STAGE;
        let ARBMessages = JSON.parse(JSON.stringify(this.ARB_received));
        
        this.beginVectorConsensus(this.prepareVectorMessage(ARBMessages, agreedHash));
    }
    
    hashARBMessage(message) {
        let messageAsList = [];
        Object.keys(message).sort().forEach(sortedMessageNodeId => {
            messageAsList.push(message[sortedMessageNodeId]);
        })  
        const hash = Crypto.hash(JSON.stringify(messageAsList));
        return hash;
    }
    
    verifyARBHash(hashToVerify, message) {
        return hashToVerify === this.hashARBMessage(message)
    }
    
    prepareARBMessage(message) {
        return [{node: this.nodeId, gossippedMessages: message, hash: this.hashARBMessage(message)}];  
    }
    
    prepareVectorMessage(message, agreedHash) {
        return [{node: this.nodeId, vectorMessages: message, agreedHash: agreedHash}];  
    }
    
    processARBMessage(message) {
        const that = this;
        message = Array.isArray(message) ? message : [message];
        
        message.forEach(source => {
            if (!that.ARB_received[source.node]) {
                // ARB messages per message node.
                that.ARB_received[source.node] = {
                    hash: source.hash,
                    gossippedMessages: {}
                };
            }
            
            that.ARB_received[source.node].hash = source.hash;
            that.ARB_received[source.node].gossippedMessages = source.gossippedMessages;
        })
        
        const afterStatus = this.checkARBProgress();
    
        if (afterStatus.totalARBSources > (this.N - this.f) ) {
            console.log('------ ' + this.nodeId + ', sources: ' + afterStatus.totalARBSources +', agreed hash: ' + afterStatus.hashAgreedByMajority);
            if (afterStatus.hashAgreedByMajority) {
                this.vectorConsensus(hashAgreedByMajority);
            }
            //console.log(prettifyJSON(Object.values(that.ARB_received)[0]))
        } else {
            let arbMessages = [];
            Object.keys(that.ARB_received).forEach(source => {
                arbMessages.push({node: source, gossippedMessages: that.ARB_received[source].gossippedMessages, hash: that.ARB_received[source].hash});
            })
            that.beginConsensus(arbMessages)   
        }
        
    }
    
    processVectorMessage(message) {
        const that = this;
        message = Array.isArray(message) ? message : [message];
        
        message.forEach(source => {
            if (!that.Vector_received[source.node]) {
                // ARB messages per message node.
                that.Vector_received[source.node] = {
                    agreedHash: source.agreedHash,
                    vectorMessages: {}
                };
            }
            
            that.Vector_received[source.node].agreedHash = source.agreedHash;
            that.Vector_received[source.node].vectorMessages = source.vectorMessages;
        })
        
        const afterStatus = this.checkVectorProgress();
    
        if (afterStatus.totalARBSources > (this.N - this.f) ) {
            console.log('------ ' + this.nodeId + ', sources: ' + afterStatus.totalARBSources +', agreed hash: ' + afterStatus.hashAgreedByMajority);
            if (afterStatus.hashAgreedByMajority) {
                this.vectorConsensus(hashAgreedByMajority);
            }
            //console.log(prettifyJSON(Object.values(that.ARB_received)[0]))
        } else {
            let arbMessages = [];
            Object.keys(that.ARB_received).forEach(source => {
                arbMessages.push({node: source, gossippedMessages: that.ARB_received[source].gossippedMessages, hash: that.ARB_received[source].hash});
            })
            that.beginConsensus(arbMessages)   
        }
        
    }
    
    beginConsensus(ARBMessage) {
        this.gossip('ARB', ARBMessage);
    }
    
    beginVectorConsensus(vectorMessage) {
        this.gossip('VECTOR', vectorMessage);
    }
    
    // Unlike reliable brodcast, which broadcasts the messages to *all* message nodes, gossip just communicates the messages to 
    // a random neighbor.
    gossip(gossipType, gossipMessage) {
        // This uses broadcast to share with everyone.
        //this.reliableBroadcast('GOSSIP', gossipMessage); return;
        
        // This uses a random neighbor.
        
        /*let randomMessageNodeId = -1;
        while (randomMessageNodeId === -1) {
            const r = Utils.randomBetweenMinMax(0, this.N);
            if (this.nodeId !== ('M'+r)) {
                randomMessageNodeId = r;
            }
        }*/
        
        // This uses a few random neighbors.
        
        const myIndex = parseInt(this.nodeId.replace(/M/,''));
        for (let g = -1; g <= 1; g++) {
            if (g !== 0) {
                let peerIndex = myIndex + g;
                if (peerIndex < 0) {
                    peerIndex = this.N + peerIndex;
                } else if (peerIndex >= this.N) {
                    peerIndex = peerIndex - this.N;
                }
                this.messageNodeGroup.spreadTheWord('M'+peerIndex, gossipType, gossipMessage);
            }
        }   
    }
    
    // Signals end of ARB protocol. The next round of ARB starts from this point.
    ARBCompleted() {
        this.currentStage = this._GOSSIP_STAGE;
        // Gossip whatever transaction batches received so far.
        let transactionBatchesReceivedSoFar = this.INPUT_received.slice(0); // Make a copy.
        this.INPUT_received.length = 0;
        this.gossip('TXNBATCH', transactionBatchesReceivedSoFar);
    }
    
}

class MessageNodeGroup {
    constructor(f) {
        this.N = (3*f + 1);
        this.f = f;
        this.messageNodes = [];
        this.setupMessageNodes();
    }
    
    setupMessageNodes() {
        for (let m = 0; m < this.N; m++) {
            let messageNode = new MessageNode(('M'+m), this.N, this.f, this);
            this.messageNodes.push(messageNode);
        }
        this.inputStage();
    }
    
    inputStage() {
        let counter = 0;
        const that = this;
        
        let generateTransactionBatch = () => {
            let messageNode = that.messageNodes[counter],
                message = {node: messageNode.nodeId, transactions: {} };
            
            // Create random number of transactions for the current message node. Format:
            // { M0: {"M0-V0": ["T0", "T1", "T2" ] } }
            
            const numValidators = Math.ceil(Math.random() * 5);
            for (let v = 0; v < numValidators; v++){
                const numMessages = Math.ceil(Math.random() * 5);
                let txnBatch = message.transactions[messageNode.nodeId + '-V'+ v] = [];
                
                for (let r = 0; r < numMessages; r++) {
                    txnBatch.push('T' + r);
                }
            }
            PubSub.publish('INPUT', message);
            counter += 1;
            if (counter === that.N) {
                // All message nodes have their message received. Trigger, ARB.
                that.triggerARB();
            }
        }
        
        Utils.interval(generateTransactionBatch, [10, 100], this.N);
    }
    
    triggerARB() {
        for (let m = 0; m < this.N; m++) {
            let messageNode = this.messageNodes[m],
                trigger = () => {
                    messageNode.ARBCompleted();
                };
            
            Utils.interval(trigger, Utils.randomBetweenMinMax(30, 100), 1);
        }
    }
    
    spreadTheWord(messageNodeId, gossipType, message) {
        let spread = () => {
            PubSub.publish('GOSSIP:'+gossipType+':'+messageNodeId, message);    
        }
        Utils.interval(spread, Utils.randomBetweenMinMax(10, 50), 1);
    }
}

let group = new MessageNodeGroup(10),
    callback = () => {
        //console.log(prettifyJSON(group.listBatches()));
        //console.log('--------------------')
        //console.log(prettifyJSON(group.listBroadcastMessages()));
    }

Utils.interval(callback, 2000, 1);
