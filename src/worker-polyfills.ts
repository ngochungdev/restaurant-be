// CF Workers forbids crypto.randomUUID() in global (module-init) scope.
// wrangler.toml [define] redirects bare crypto.randomUUID calls to
// globalThis.__cfRUUID. This file must be the first import in worker.ts so
// the polyfill is in place before @nestjs/typeorm evaluates its @Module decorator.
let _c = 0;
(globalThis as any).__cfRUUID = () => `cf${++_c}`;
