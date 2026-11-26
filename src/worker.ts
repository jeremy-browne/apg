import handler from "@astrojs/cloudflare/entrypoints/server";
import { runHealthChecks, sendHealthAlert, type Fetcher } from "./health";

type Env = Record<string, unknown>;
type Ctx = { waitUntil(promise: Promise<unknown>): void; passThroughOnException?(): void };

// Calls the Astro app in-process, so health checks never leave the Worker.
function appFetcher(env: Env, ctx: Ctx): Fetcher {
  const appCtx = {
    waitUntil: (p: Promise<unknown>) => ctx.waitUntil(p),
    passThroughOnException: () => {},
    props: {},
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- adapter handler types are wider than ours
  return (request) => (handler as any).fetch(request, env, appCtx);
}

export default {
  ...handler,

  async fetch(request: Request, env: Env, ctx: Ctx) {
    if (new URL(request.url).pathname === "/api/health") {
      const results = await runHealthChecks(appFetcher(env, ctx));
      const ok = results.every((r) => r.ok);
      return Response.json(
        { ok, checkedAt: new Date().toISOString(), results },
        { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (handler as any).fetch(request, env, ctx);
  },

  // Daily Cron Trigger (see "triggers" in wrangler.jsonc): email on failure.
  async scheduled(_controller: unknown, env: Env, ctx: Ctx) {
    const results = await runHealthChecks(appFetcher(env, ctx));
    const failed = results.filter((r) => !r.ok);
    console.log("[health]", failed.length ? `${failed.length} failing` : "all ok", JSON.stringify(results));
    const apiKey = env.RESEND_API_KEY;
    if (failed.length && typeof apiKey === "string") await sendHealthAlert(apiKey, results);
  },
};
