# SSB-Keys

supplies key loading and other cryptographic functions needed in secure-scuttlebutt apps.

```js
var ssbkeys = require('ssb-keys')

//usually, load keys like this
var keys = ssbkeys.loadOrCreateSync(filename)
/* => {
  id: String,
  public: String,
  private: String
}*/

//but for testing, .generate() is useful.
var keys = ssbkeys.generate()
/* => {
  id: String,
  public: String,
  private: String
}*/


//hmac_key is a fixed value that applies to _THIS_ signature use, see below.

var obj = ssbkeys.signObj(k, hmac_key, { foo: 'bar' })
console.log(obj) /* => {
  foo: 'bar',
  signature: ...
} */
ssbkeys.verifyObj(k, hmac_key, obj) // => true
```

## api

### loadOrCreateSync (filename)

Load a file containing the your private key. the file will also
contain a comment with a warning about keeping the file secret.

Works in the browser, or stores the keys is localStorage in the browser.
(web apps should be hosted a secure way, for example [web-bootloader](https://github.com/dominictarr/web-bootloader))

If the file does not exist it will be created. there is also
variations and parts `loadOrCreate` (async), `load`, `create`
`createSync` `loadSync`. But since you only need to load once,
using the combined function is easiest.

### generate(curve, seed)

generate a key, with optional seed.
curve defaults to `ed25519` (and no other type is currently supported)
seed should be a 32 byte buffer.

### signObj(keys, hmac_key?, obj)

signs a javascript object, and then adds a signature property to it.

If `hmac_key` is provided, the object is hmaced before signing,
which means it cannot be verified without the correct `hmac_key`.
If each way that signatures are used in your application use a different
hmac key, it means that a signature intended for one use cannot be reused in another
(chosen protocol attack)

### verifyObj(keys, hmac_key?, obj)

verify a signed object. `hmac_key` must be the same value as passed to `signObj`.

### box(msg, recipients)

encrypt a message to many recipients. msg will be JSON encoded, then encrypted
with [private-box](https://github.com/auditdrivencrypto/private-box)

### unbox (boxed, keys)

decrypt a message encrypted with `box`. If the `boxed` successfully decrypted,
the parsed JSON is returned, if not, `undefined` is returned.

### LICENSE

MIT

