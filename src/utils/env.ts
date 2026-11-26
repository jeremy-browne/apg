/// <reference types="@cloudflare/workers-types" />
// Read a runtime environment variable / secret on Cloudflare Workers.
//
// Secrets set via `wrangler secret put` are runtime bindings — they are NOT
// visible via `import.meta.env` (which Vite inlines at build time). Astro v6
// removed `Astro.locals.runtime.env` (accessing it now throws), so read them
// from the `env` export of `cloudflare:workers`. Fall back to `import.meta.env`
// for values only present in a local `.env` file during dev.
import { env } from "cloudflare:workers";

export function readEnv(key: string): string | undefined {
  const value = (env as unknown as Record<string, unknown>)[key];
  if (typeof value === "string") return value;
  return (import.meta.env as Record<string, string | undefined>)[key];
}
