# Aussie Pilot Guide

An Australian flight training blog and resource site helping student pilots navigate their training journey — from first flight to first job.

## Tech stack

- **Framework:** Astro (server-rendered, `output: "server"`)
- **Blog content:** [emdash](https://emdashcms.com) CMS — served live from Cloudflare D1 (prod) / local `emdash.db` (dev), not from files
- **Other content:** Markdown in `src/content/` for `authors`, `legal`, `about` (file-based collections)
- **Styling:** Tailwind CSS
- **Interactive components:** React (used sparingly via Astro islands, only where interactivity is needed)
- **Deployment:** Cloudflare Workers (via `@astrojs/cloudflare`); media in R2
- **Package manager:** npm

## Commands

```
npm run dev          # Start dev server (emdash on local emdash.db)
npm run build        # Production build (reads PUBLIC_* from .env)
npm run preview      # Preview production build locally
npm run astro check  # TypeScript/Astro diagnostics
npx wrangler deploy  # Build + this = release to Cloudflare Workers

npm run optimise:image -- <input> [name]              # → spec-compliant WebP in public/images/blog/
npm run import:posts -- --url <inst> --token <ec_pat> # legacy .md → emdash (--refresh / --dry-run)
```

For a non-production build origin (e.g. a `*.workers.dev` preview) set `EMDASH_SITE_URL=https://<host>` so canonical URLs and the admin passkey rpId match that origin.

## Project structure

```
src/
├── content/
│   ├── authors/       # Author profile pages (.md, slug = filename)
│   ├── legal/ about/ licenses/   # Other file-based collections
│   └── blog/          # Legacy markdown sources — NOT read by the site
├── content.config.ts  # File-based collections (Zod schemas)
├── live.config.ts     # emdash live collection (blog content from D1/emdash.db)
├── actions/           # Astro Actions (contact, newsletter) — read runtime secrets via utils/env.ts
├── middleware.ts      # Security headers + www→apex redirect
├── components/        # Astro + React (React only where interactivity is needed)
├── layouts/
├── pages/
│   ├── api/search.ts      # SSR endpoint backed by emdash full-text search
│   ├── authors/
│   │   ├── index.astro    # SSR: redirect to solo author, or ranked list
│   │   └── [slug].astro   # Profile page (file profile) + the byline's posts (emdash)
│   └── blog/[id].astro    # Blog post (emdash, runtime)
├── utils/             # incl. media.ts (resolve emdash media URLs), env.ts (runtime secrets)
└── styles/
worker.ts (src/)       # Cloudflare Worker entrypoint
wrangler.jsonc         # Bindings (D1 DB, R2 MEDIA, KV SESSION) + custom domains
public/                # Static assets; images/blog/ holds source WebPs
scripts/               # optimise-image.mjs, import-posts.mjs
```

## Content conventions

> **Blog content now lives in the emdash CMS, not in files.** Posts are authored
> and managed at `/_emdash/admin` and served live at runtime from Cloudflare D1
> (production) or the local `emdash.db` (dev) via Astro live collections
> (`getEmDashCollection`/`getEmDashEntry`, see `src/live.config.ts`). Because the
> content is fetched at request time, blog pages are **server-rendered, not
> prerendered** — and site search uses emdash's full-text search (`/api/search`),
> not a static index. The `src/content/blog/*.md` files below are **legacy source
> material**, kept for history but no longer read by the site. The
> `authors`, `legal`, and `about` collections remain file-based (see
> `src/content.config.ts`).

### Blog posts (legacy file format)

Historically, blog posts lived in `src/content/blog/` as Markdown files with YAML frontmatter. New posts are created in the emdash admin instead; this section documents the legacy file shape:

```yaml
---
title: "How to Become a Pilot in Australia"
description: "A complete guide to pilot training pathways in Australia — RAAus, RPL, PPL, CPL and beyond."
pubDate: 2026-04-25
updatedDate: 2026-04-25
authors:
  - "Jeremy Browne"
tags: ["rpl", "ppl", "cpl", "casa", "raaus"]
draft: false
---
```

**How the legacy fields map to emdash** (the importer applies this; useful when reading the migrated content): `description`→`excerpt`, `pubDate`→`publishedAt`, `updatedDate`→`updatedAt`, `authors`→`bylines`, `image`→`featured_image` (R2 reference), `draft`→`status`, `featured` stays, and `tags`/`category` become `tag`/`category` taxonomy terms. emdash post content is **PortableText**, not markdown.

### Content categories

Categories are now `category` taxonomy terms in emdash (and `tag` for tags). Use these categories to organise posts; check existing terms before adding new ones:

- `training-pathways` — licence types, RPC vs RPL, how to become a pilot
- `gear` — what to buy at each stage (student, PPL, CPL)
- `career` — getting your first job, industry outlook, pilot shortage
- `theory` — study tips, exam prep, aerodynamics explainers
- `operations` — flight planning, weather, airspace
- `lifestyle` — what training is actually like, day-in-the-life

### Images

Featured images are uploaded through the emdash admin (stored in R2, referenced as a media field — resolve a URL with `mediaUrl()` in `src/utils/media.ts`). Prepare source files to spec **before** uploading; `public/images/blog/` holds the optimised source WebPs.

**Specs:**

- **Aspect ratio:** 16:9 — all card and post header layouts crop to this ratio
- **Resolution:** 1600×900px
- **Format:** WebP
- **Quality:** ~80% (aim for under 300 KB)

Run `npm run optimise:image -- <input-path> [output-basename]` to crop to 16:9, resize to 1600×900, and write a WebP into `public/images/blog/`. Do not commit full-resolution originals.

### Authors

Authorship has **two linked parts**:

- **Byline** (post attribution) — created in the emdash admin; carries the display name + slug shown on each post. Assigned to posts via the CMS, not a frontmatter `authors` array.
- **Profile page** (`/authors/[slug]`) — a Markdown file in `src/content/authors/` (filename = slug) with bio/role/image.

They link by **slug**: a byline `jeremy-browne` resolves to `src/content/authors/jeremy-browne.md`.

```yaml
---
name: "Jeremy Browne"
role: "Commercial Pilot & Grade 3 Flight Instructor"  # optional
image:                                                 # optional
  src: /images/authors/jeremy-browne.webp
  alt: Jeremy Browne
---

Bio text in Markdown...
```

**Routing behaviour (both SSR — `output: "server"`):**
- `/authors` — one author redirects to their profile; multiple shows a ranked list (most posts first).
- `/authors/[slug]` — profile page (file-based bio) + a grid of that byline's emdash posts.

**Adding a new author:**
1. Create the **byline** in the emdash admin and assign it to posts.
2. Create `src/content/authors/<slug>.md` (slug matching the byline) for the profile page.

A byline whose slug has no matching profile file renders as plain text (no link) rather than breaking.

### Tags

Use lowercase, hyphenated tags. Prefer existing tags over creating new ones. Common tags include: `rpl`, `ppl`, `cpl`, `atpl`, `raaus`, `casa`, `tif`, `gear`, `career`, `weather`, `navigation`, `aeroprakt`, `piper`, `cessna`.

## Writing style

- **Audience:** Prospective and current student pilots in Australia. Assume no prior aviation knowledge unless the post is tagged for a specific licence level.
- **Tone:** Approachable, conversational, and opinionated. Like advice from an experienced instructor — not a CASA publication. Use "you" freely.
- **Authority:** The author is a Commercial Pilot and Grade 3 Flight Instructor based in Melbourne. Content reflects real experience, not generic advice.
- **Australian context:** Use Australian terminology (aeroplane not airplane, licence not license, programme not program). Reference CASA, RAAus, BoM, ERSA, AIP where relevant.
- **Specificity over vagueness:** Include real numbers, costs, hour requirements, and aircraft types where possible. Students want concrete information.
- **No jargon without explanation:** If using an abbreviation for the first time in a post, spell it out. Example: "Recreational Pilot Certificate (RPC)".

## Code style

- Use TypeScript for Astro components and config
- Use functional React components with hooks (no class components)
- Prefer Astro components (`.astro`) over React — only use React (`.tsx`) when client-side interactivity is genuinely needed
- Use Tailwind utility classes; avoid custom CSS unless Tailwind can't express it
- Keep components small and single-purpose

## Architecture notes

- **Server-rendered (`output: "server"`) on Cloudflare Workers.** emdash serves blog content live at runtime via Astro **live collections** (`getEmDashCollection`/`getEmDashEntry`, see `src/live.config.ts`) — it cannot be prerendered. Keep client-side JS minimal; render React only as Astro islands (`client:load`/`client:visible`), never whole pages.
- **emdash injects routes**: the admin + API under `/_emdash/*`, plus `/robots.txt` and `/sitemap.xml`. Don't add local routes that collide with these.
- **Search** is emdash full-text search via `src/pages/api/search.ts` (SSR). Pagefind was removed — it needs static HTML, which runtime content doesn't produce.
- **Media** is uploaded to R2 and served at `/_emdash/api/media/file/<storageKey>`. A media field is a reference (no ready `src`); resolve a URL with `mediaUrl()` in `src/utils/media.ts`.
- **`siteUrl`** (`astro.config.mjs`) defaults to `https://aussiepilotguide.com`; override per-build with `EMDASH_SITE_URL`. It drives the WebAuthn **passkey rpId**, so admin passkeys are domain-bound — changing the domain invalidates existing passkeys (re-register on the new origin).
- **Security headers** are set in `src/middleware.ts` (a Worker's static `_headers` only applies to assets, not SSR HTML). It skips `/_emdash/*` so the admin's iframes/passkeys keep working, and redirects `www` → apex.
- **Forms** (`src/actions/`, `src/pages/api/newsletter/`) read runtime secrets via `readEnv()` in `src/utils/env.ts` (`locals.runtime.env`) — `import.meta.env` does **not** see `wrangler secret put` secrets at runtime on Workers.
- **Dev gotcha:** `astro.config.mjs` sets `vite.ssr.noExternal: ["@astrojs/react"]` so the React renderer's `astro:react:opts` virtual module resolves; without it `npm run dev` crashes (`Received protocol 'astro:'`).
- **File-based collections** (`authors`, `legal`, `about`, `licenses`) are still defined in `src/content.config.ts` with Zod schemas.

## Deployment & secrets

Hosted on Cloudflare Workers (`aussiepilotguide.com` custom domain, `wrangler.jsonc`). Release with `npm run build && npx wrangler deploy`. Bindings: D1 `DB`, R2 `MEDIA`, KV `SESSION`. Runtime secrets (`wrangler secret put`): `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `NEWSLETTER_SECRET`. Build-time public var (`.env`): `PUBLIC_TURNSTILE_SITE_KEY`.

**emdash email provider** (`src/plugins/resend-email.ts`) is the exception: a `PluginContext` can't reach `locals.runtime.env`, so its Resend key + From address are entered in the admin under **Plugins → Resend → Settings** and stored in D1 `options` as `plugin:emdash-resend-email:settings:*`. They must be set once per database (dev `emdash.db` and prod D1 separately). The `RESEND_API_KEY` secret above is unrelated — it stays in use by the contact form and newsletter via `readEnv()`.

### Deploy gotchas

Each of these has already cost a broken or failed deploy — check them before releasing.

- **Always rebuild before deploying — never `wrangler deploy` alone.** `@astrojs/cloudflare` writes a resolved copy of the config to `dist/server/wrangler.json` at build time, and wrangler deploys from *that*, not from `wrangler.jsonc`. Editing `wrangler.jsonc` has no effect until you rebuild, and the failure is confusing: wrangler reports the *old* binding values back to you. This is why the release command is always `npm run build && npx wrangler deploy`.
- **Declaring `vite.resolve` in `astro.config.mjs` replaces emdash's**, rather than merging with it. emdash sets `resolve.dedupe: ["@emdash-cms/admin", "react", "react-dom"]`; if you add a `resolve` block you must repeat that list, or the admin loads a second copy of React and every island dies with `react/index.js does not provide an export named 'createElement'`. The public site keeps working, so this only shows up in `/_emdash/admin`.
- **Verify the admin after any Vite/React config change** — load `/_emdash/admin` and confirm it renders past "Loading EmDash…". A production build succeeding proves nothing about hydration.
- **Replacing the SESSION KV namespace signs out every admin user.** Passkeys live in D1 and survive, so signing in again is enough — but don't rotate the namespace when you need uninterrupted access.
- **Cache-bust when checking admin APIs in a browser.** `/_emdash/api/*` responses are cached per URL; a stale 200 can look like a real answer long after the state changed. Add a throwaway query param.

### emdash plugins

- Plugins are registered in the `plugins: []` array of the `emdash()` integration in `astro.config.mjs`; there is no install step. A descriptor's `entrypoint` is emitted **verbatim** into a generated virtual module (`\0virtual:emdash/plugins`), so it must be a resolvable module specifier — a relative path like `./src/plugins/x.ts` resolves against the virtual module, not the config file. Local plugins therefore go through a `vite.resolve.alias` (see `resendPluginEntrypoint` in `astro.config.mjs`).
- Capabilities are enforced silently: a hook whose required capability is missing from the descriptor is **skipped without warning**. `email:deliver` needs `hooks.email-transport:register`; `ctx.http` needs `network:request` plus `allowedHosts`.
- A plugin's Block Kit settings page lives at `/_emdash/admin/plugins/<plugin-id>/settings` (and in the sidebar's PLUGINS section). The gear icon on the plugins list goes to `/_emdash/admin/plugins/<plugin-id>`, which renders blank — not a bug in the plugin.

## Built since the original scope

- **Newsletter** — double opt-in capture via `src/actions/` + `src/pages/api/newsletter/confirm.ts` (Resend audience, HMAC-signed token). **Contact form** likewise (Resend + Turnstile).

## Future scope (do not build yet, but design with these in mind)

- **Online theory courses** — gated content with auth, likely SSR routes under `/courses/` (the site is already SSR with emdash + D1 to build on).
- **Practice exams** — interactive React islands with a backend (D1/emdash or Supabase).
- **Gear store** — product pages with Stripe or Shopify Storefront API integration.

Keep the content schemas, routing, and component architecture flexible enough to support these without major refactoring.