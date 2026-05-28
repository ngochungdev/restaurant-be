// ESM entry point for Cloudflare Workers.
// NestJS CLI compiles worker.ts to CJS (exports.default), but Cloudflare Workers
// requires a true ESM default export. This wrapper bridges the gap.
//
// setup-cf.mjs MUST be imported first: it sets globalThis.__cfRUUID before
// dist/worker.js is evaluated. @nestjs/typeorm calls crypto.randomUUID() at
// module-init (global) scope which is forbidden in CF Workers; wrangler.toml
// [define] redirects those calls to globalThis.__cfRUUID.
import './setup-cf.mjs';
import worker from './dist/worker.js';
export default worker;
