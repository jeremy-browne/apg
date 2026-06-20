// Read an environment variable that works both on Cloudflare Workers and in dev.
//
// On Workers, secrets set via `wrangler secret put` are runtime bindings exposed
// at `Astro.locals.runtime.env` — they are NOT visible via `import.meta.env`
// (which Vite inlines at build time). In dev (no Cloudflare adapter) there is no
// `locals.runtime`, so fall back to `import.meta.env` / the `.env` file.

type RuntimeLocals = { runtime?: { env?: Record<string, string | undefined> } };

export function readEnv(locals: RuntimeLocals | undefined, key: string): string | undefined {
  return (
    locals?.runtime?.env?.[key] ??
    (import.meta.env as Record<string, string | undefined>)[key]
  );
}
