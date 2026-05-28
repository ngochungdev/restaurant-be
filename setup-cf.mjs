// Runs before dist/worker.js is evaluated (see worker-cf.mjs import order).
// CF Workers forbids crypto.randomUUID() in global scope; this replaces it
// with a simple counter (see [define] in wrangler.toml).
let c = 0;
globalThis.__cfRUUID = () => `cf${++c}`;
