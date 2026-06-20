import { defineMiddleware } from "astro:middleware";

// Ported from the old Netlify public/_headers. On Cloudflare Workers, _headers
// only applies to static assets served by the ASSETS binding, not to SSR HTML —
// so set the security headers here for rendered pages too.
const PERMISSIONS_POLICY =
  "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(self), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(self), xr-spatial-tracking=()";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Robots-Tag": "index, follow",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": PERMISSIONS_POLICY,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "form-action 'self';",
};

const APEX = "aussiepilotguide.com";

export const onRequest = defineMiddleware(async (context, next) => {
  // Canonical host: redirect www -> apex, preserving path + query.
  if (context.url.hostname === `www.${APEX}`) {
    const target = new URL(context.url);
    target.hostname = APEX;
    return context.redirect(target.toString(), 301);
  }

  const response = await next();

  // Apply security headers to public responses only. The emdash admin/API
  // (/_emdash/*) manages its own framing/CSP and uses WebAuthn — applying
  // X-Frame-Options: DENY or `publickey-credentials-get=()` there would break
  // the admin's preview iframes and passkey login.
  if (!context.url.pathname.startsWith("/_emdash")) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!response.headers.has(key)) response.headers.set(key, value);
    }
  }
  return response;
});
