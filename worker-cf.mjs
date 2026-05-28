// ESM entry point for Cloudflare Workers.
// NestJS CLI compiles worker.ts to CJS (exports.default), but Cloudflare Workers
// requires a true ESM default export. This wrapper bridges the gap.
import worker from './dist/worker.js';
export default worker;
