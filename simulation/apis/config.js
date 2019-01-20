// All the public information used across the simulation app.

let PublicInfo = {
    network: {
        // Will be filled in as the simulation runs.
    },
    
    publicKeys: {
        validators: {
            
        },
        
        messageNodes: {
            
        }
    },
    
    addValidatorKey(key) {
        this.publicKeys.validators[key.id] = key.publicKey;
    },
    
    addMessageNodeKey(key) {
        this.publicKeys.messageNodes[key.id] = key.publicKey;
    },
    
    dump() {
        return {
            'Network': this.network,
            'Validator Public Keys': this.publicKeys.validators,
            'MessageNode Public Keys': this.publicKeys.messageNodes
        }
    }
}

module.exports = PublicInfo;