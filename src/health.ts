// Production smoke test, run inside the Worker.
//
// Each check calls the site's own request handler directly (no network hop),
// so Cloudflare bot protection can't block it the way it blocks GitHub-hosted
// runners. Used by:
//   - GET /api/health  -> JSON results, no side effects
//   - the daily Cron Trigger (src/worker.ts) -> emails on failure via Resend
//
// None of the checks send email: the form actions are called without a
// Turnstile token, so they must reject with 400 before reaching Resend.

export const SITE_ORIGIN = "https://aussiepilotguide.com";
export const ALERT_TO = "jeremybrowne1991@gmail.com";
const ALERT_FROM = "Aussie Pilot Guide <hello@aussiepilotguide.com>";

export type Fetcher = (request: Request) => Promise<Response>;
export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

function req(path: string, init?: RequestInit): Request {
  return new Request(new URL(path, SITE_ORIGIN), init);
}

function formPost(path: string, fields: Record<string, string>): Request {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return req(path, { method: "POST", body, headers: { Origin: SITE_ORIGIN } });
}

// A well-formed but unsigned token: must be rejected as "invalid". "error"
// means a secret (NEWSLETTER_SECRET / RESEND_*) is missing.
function fakeConfirmToken(): string {
  const payload = btoa(JSON.stringify({ email: "a@b.co", exp: 1 }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${payload}.AAAA`;
}

type Check = {
  name: string;
  request: () => Request;
  expect: (res: Response) => Promise<string | null>; // null = pass, string = failure detail
};

const status = (want: number) => async (res: Response) =>
  res.status === want ? null : `status ${res.status}, expected ${want}`;

const contains = (needle: string, what: string) => async (res: Response) => {
  if (res.status !== 200) return `status ${res.status}`;
  return (await res.text()).includes(needle) ? null : `no ${what} in response`;
};

const CHECKS: Check[] = [
  { name: "Home page", request: () => req("/"), expect: status(200) },
  { name: "Blog index", request: () => req("/blog/"), expect: status(200) },
  {
    name: "Turnstile site key rendered",
    request: () => req("/newsletter"),
    expect: contains('data-sitekey="0x', "Turnstile site key"),
  },
  {
    name: "Newsletter subscribe handler",
    request: () => formPost("/_actions/newsletterSubscribe", { email: "healthcheck@example.com" }),
    expect: status(400),
  },
  {
    name: "Contact form handler",
    request: () =>
      formPost("/_actions/contact", { name: "x", email: "healthcheck@example.com", message: "x" }),
    expect: status(400),
  },
  {
    name: "Newsletter confirm secrets",
    request: () => req(`/api/newsletter/confirm?token=${fakeConfirmToken()}`, { redirect: "manual" }),
    expect: async (res) => {
      const loc = res.headers.get("Location") ?? "";
      return loc.includes("confirmed=invalid") ? null : `redirected to "${loc}" (status ${res.status})`;
    },
  },
  { name: "RSS has posts", request: () => req("/rss.xml"), expect: contains("<item>", "<item>") },
  { name: "llms.txt lists posts", request: () => req("/llms.txt"), expect: contains("/blog/", "post links") },
  { name: "Sitemap lists posts", request: () => req("/sitemap-posts.xml"), expect: contains("<loc>", "<loc>") },
];

export async function runHealthChecks(fetcher: Fetcher): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const check of CHECKS) {
    try {
      const failure = await check.expect(await fetcher(check.request()));
      results.push({ name: check.name, ok: failure === null, detail: failure ?? "ok" });
    } catch (err) {
      results.push({ name: check.name, ok: false, detail: `threw: ${String(err)}` });
    }
  }
  return results;
}

export async function sendHealthAlert(apiKey: string, results: CheckResult[]): Promise<void> {
  const failed = results.filter((r) => !r.ok);
  const rows = results
    .map((r) => `<li>${r.ok ? "✅" : "❌"} <strong>${r.name}</strong>: ${r.detail}</li>`)
    .join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: ALERT_FROM,
      to: [ALERT_TO],
      subject: `⚠️ aussiepilotguide.com health check: ${failed.length} failing`,
      html: `<p>The daily health check found problems:</p><ul>${rows}</ul>
<p>Logs: Cloudflare dashboard → Workers → aussie-pilot-guide → Observability.
Re-run any time at <a href="${SITE_ORIGIN}/api/health">${SITE_ORIGIN}/api/health</a>.</p>`,
    }),
  });
  if (!res.ok) console.error("[health] alert email failed:", res.status, await res.text());
}
