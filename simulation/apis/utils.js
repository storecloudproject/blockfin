// All utilities.

module.exports = class Utils {
    
    // Clone an object.
    static clone (obj) {
        let _obj = {}
        for (var k in obj) {
            if (Object.hasOwnProperty.call(obj, k)) {
                _obj[k] = obj[k];
            }
        }
        return _obj;
    }
    
    // setInterval alternative -- https://www.thecodeship.com/web-development/alternative-to-javascript-evil-setinterval/
    // times can be undefined to run it forever
    static interval(func, wait, times) {
        // Arrow functions don't work in this construct!
        let waitFn;
        if (Array.isArray(wait)) {
            // wait can be a [min, max] array to choose a random interval between the invocations.
            waitFn = () => {
                const r = Math.floor(Math.random() * (wait[1]-wait[0]+1) + wait[0]);
                //console.log('Interval: ' + r);
                return r;
            } 
        } else {
            waitFn = () => {
                return wait;
            }
        }
        
        let interv = function(w, t) {
            return () => {
                if (typeof t === "undefined" || t-- > 0) {
                    setTimeout(interv, w());
                    try{
                        func.call(null);
                    }
                    catch(e){
                        t = 0;
                        throw e.toString();
                    }
                }
            };
        } (waitFn, times);

        setTimeout(interv, waitFn());
    }
    
    // Produce a random number between a min and max threshold.
    static randomBetweenMinMax(min, max) {
        return Math.floor(Math.random() * (max-min+1) + min);
    }
}