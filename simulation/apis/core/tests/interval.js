const Utils = require('../../utils.js')

let callback = () => {
    console.log('I am called at ' + (new Date()).toString())
}

const timeout = Utils.randomBetweenMinMax(3000, 6000);
//Utils.interval(callback, timeout, 2)

//Utils.interval(callback, [3000,5000], 2)

class MessageNode {
    constructor(id) {
        this.id = id;
    }
    get ID() {
        return this.id;
    }
    
    doSomething() {
        console.log('Did something at: ' + this.ID)
    }
}
 
for (let m = 0; m < 5; m++) {
    let messageNode = new MessageNode('M'+m),
        trigger = () => {
            messageNode.doSomething();
        };

    Utils.interval(trigger, [1000, 2000], 1);
}