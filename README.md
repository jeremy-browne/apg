# Aussie Pilot Guide

An Australian flight training blog helping student pilots navigate their training journey — from first flight to first job.

Built with [Astro](https://astro.build) (server-rendered), [Tailwind CSS](https://tailwindcss.com), the [emdash](https://emdashcms.com) CMS, and deployed on [Cloudflare Workers](https://workers.cloudflare.com) (D1 + R2).

## Getting started

```bash
npm install
npm run dev       # http://localhost:4321
```

Blog content is served by emdash — from a local SQLite database (`emdash.db`) in dev and Cloudflare D1 in production. Manage content at `/_emdash/admin`.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Local dev server (emdash on local SQLite) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run astro check` | TypeScript / Astro diagnostics |
| `npx wrangler deploy` | Deploy the Worker to Cloudflare (release) |
| `npm run optimise:image -- <input> [name]` | Crop/resize a source image to a spec-compliant WebP |
| `npm run import:posts -- --url <inst> --token <ec_pat_…>` | Import legacy markdown posts into emdash (`--refresh` to update, `--dry-run` to preview) |

## Content

### Blog posts

Blog posts are authored in the **emdash CMS** at `/_emdash/admin` (stored in D1 in prod, `emdash.db` in dev) — not in files. Each post has a title, excerpt, rich-text content, an optional featured image (uploaded to R2), a `featured` pin order (homepage), `tag` + `category` taxonomy terms, and author byline(s).

The legacy markdown sources in `src/content/blog/*.md` are kept for history only — the site does **not** read them. `scripts/import-posts.mjs` converts them into emdash (handling tables, `*italic*`, and inline HTML that emdash's markdown importer doesn't).

### Authors

Authorship has two linked parts:

- **Byline** (attribution) — created in the emdash admin; carries the display name + slug shown on each post.
- **Profile page** (`/authors/[slug]`) — a Markdown file in `src/content/authors/` (filename = slug) with bio/role/image.

They link by **slug**: a byline `jeremy-browne` resolves to `src/content/authors/jeremy-browne.md`. A byline with no matching profile file renders as plain text (no link).

```yaml
---
name: "Jeremy Browne"
role: "Commercial Pilot & Grade 3 Flight Instructor"  # optional
---

Bio in Markdown...
```

**Routing:** `/authors` redirects to the sole author (or lists them, ranked by post count); `/authors/[slug]` is the profile page.

### Images

Featured images are uploaded through the emdash admin (stored in R2). To prepare a source image to spec (16:9, 1600×900, WebP, <300 KB) before uploading:

```bash
npm run optimise:image -- <input-path> [output-basename]
```

## Configuration

Global settings, SEO metadata, and navigation are in `src/site.config.ts`. Cloudflare bindings and the custom domain are in `wrangler.jsonc`.

## Environment variables

**Build-time** (`.env`, public): `PUBLIC_TURNSTILE_SITE_KEY`. For a non-production build origin (e.g. a preview deploy), also set `EMDASH_SITE_URL=https://<host>` so canonical URLs and the admin passkey relying-party id match the origin.

**Runtime secrets** — set with `npx wrangler secret put <NAME>` (never in `.env` or git):

| Secret | Used by |
|---|---|
| `TURNSTILE_SECRET_KEY` | Contact + newsletter Turnstile verification |
| `RESEND_API_KEY` | Sending contact/newsletter emails (Resend) |
| `RESEND_AUDIENCE_ID` | Newsletter audience |
| `NEWSLETTER_SECRET` | Signing newsletter confirmation tokens |

## Deployment

Hosted on Cloudflare Workers at `aussiepilotguide.com` (custom domain in `wrangler.jsonc`). Build, then deploy:

```bash
npm run build
npx wrangler deploy
```

Bindings: D1 `DB` (content), R2 `MEDIA` (uploads), KV `SESSION` (admin sessions).

## Project structure

```
src/
├── content/
│   ├── authors/        # Author profile pages (.md, filename = slug)
│   ├── legal/ about/ licenses/   # Other file-based collections
│   └── blog/           # Legacy markdown sources (not read by the site)
├── content.config.ts   # File-based collections (Zod schemas)
├── live.config.ts      # emdash live collection (blog content from D1)
├── actions/            # Astro Actions (contact, newsletter)
├── middleware.ts       # Security headers + www→apex redirect
├── components/ layouts/ pages/ styles/ utils/
├── worker.ts           # Cloudflare Worker entrypoint
public/                 # Static assets; images/blog/ holds source WebPs
scripts/                # optimise-image.mjs, import-posts.mjs
```
```
