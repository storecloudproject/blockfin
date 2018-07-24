# sodium-browserify

A polyfil between the apis of [node-sodium](https://github.com/paixaop/node-sodium/)
and [libsodium-wrappers](https://github.com/jedisct1/libsodium.js), heir to [crypto-browserify](https://github.com/crypto-browserify/crypto-browserify)

Mainly, this wraps libsodium-wrappers to make it work with buffers,
and pass the same tests as it does in node, and in the browser.

## UPDATE: WebAssembly!

This now uses webassembly, for a massive speed improvement.
one of the weird quirks of webassembly is that it gets loaded async,
which means you'll only get this speed improvement after waiting a little while,
say 50ms, but in most applications something else will need to load, such as reading database
state or waiting for connections, so this will happen on it's own.

If you try to use this before the wasm has loaded, it will fallback to tweetnacl.

Tests are generated from sodium, with values stored in JSON so that they can be run in the browser.

## License

MIT


