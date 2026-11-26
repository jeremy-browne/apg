// Minimal types for the Workers runtime module used by src/utils/env.ts.
// (Referencing @cloudflare/workers-types globally would replace the DOM lib
// types that client scripts such as src/scripts/search.ts rely on.)
declare module "cloudflare:workers" {
  export const env: Record<string, unknown>;
}
