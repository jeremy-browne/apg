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
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run astro check  # TypeScript/Astro diagnostics
```

## Project structure

```
src/
├── content/
│   ├── blog/          # Blog posts as .md/.mdx files
│   └── authors/       # Author profiles as .md files (slug = filename)
├── components/        # Astro and React components
│   ├── *.astro        # Static layout components
│   └── *.tsx          # Interactive React islands (client:load / client:visible)
├── layouts/           # Page layouts
├── pages/
│   ├── authors/
│   │   ├── index.astro    # SSR: redirects to solo author, or lists all authors
│   │   └── [slug].astro   # Static: individual author profile + their posts
│   └── ...            # Other file-based routes
└── styles/            # Global styles
public/                # Static assets (images, fonts, favicons)
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

The `authors` field is an array of display-name strings. Each name must match an author profile in `src/content/authors/` — the filename is the slugified name (e.g. `"Jeremy Browne"` → `jeremy-browne.md`). If a name has no matching profile, the build logs a warning and the name renders as plain text instead of a link.

### Content categories

Use these categories to organise posts. New categories can be added but check existing ones first:

- `training-pathways` — licence types, RPC vs RPL, how to become a pilot
- `gear` — what to buy at each stage (student, PPL, CPL)
- `career` — getting your first job, industry outlook, pilot shortage
- `theory` — study tips, exam prep, aerodynamics explainers
- `operations` — flight planning, weather, airspace
- `lifestyle` — what training is actually like, day-in-the-life

### Images

Blog post images live in `public/images/blog/`. Reference them in frontmatter as:

```yaml
image:
  src: /images/blog/your-image.webp
  alt: Descriptive alt text
```

**Specs before committing:**

- **Aspect ratio:** 16:9 — all card and post header layouts crop to this ratio
- **Resolution:** 1600×900px
- **Format:** WebP
- **Quality:** ~80% (aim for under 300 KB)

Run `npm run optimise:image -- <input-path> [output-basename]` to crop to 16:9, resize to 1600×900, and write a WebP into `public/images/blog/`. Do not commit full-resolution originals.

### Authors

Author profiles live in `src/content/authors/` as Markdown files. The filename becomes the URL slug and must be the slugified form of the author's display name (`Jeremy Browne` → `jeremy-browne.md`).

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

**Routing behaviour:**
- `/authors` — if one author exists, redirects to their profile; if multiple, shows a ranked list (most articles first). This page is SSR (not prerendered) so it always reflects the current author set without a cache-busting rebuild.
- `/authors/[slug]` — static profile page with bio and a grid of the author's posts.

**Adding a new author:**
1. Create `src/content/authors/[slug].md` with the frontmatter above.
2. Use the author's display name (matching the slug) in any blog post `authors` array.
3. The build will automatically include them in the `/authors` list and generate their profile page.

**Missing profile warning:** If a blog post names an author with no matching profile file, `npm run build` and `npm run dev` emit a console warning identifying the post and the expected file path. The author name renders as plain text (no broken link) until a profile is created.

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

- The site is static-first. Most pages should be fully static with zero client-side JS.
- React components are rendered as Astro islands using `client:load` or `client:visible` directives. Do not wrap entire pages in React.
- Content collections are defined in `src/content.config.ts` with Zod schemas for type-safe frontmatter validation.
- Blog images are stored in `public/images/blog/` and referenced in frontmatter as `/images/blog/filename.webp`. They are served as-is from Cloudflare's CDN, so compress them before committing.
- The site uses hybrid rendering: almost all pages are prerendered (static), but `src/pages/authors/index.astro` has `export const prerender = false` so author-count-dependent redirect logic is evaluated fresh on each request rather than being baked into the build.

## Future scope (do not build yet, but design with these in mind)

- **Online theory courses** — gated content with auth, likely SSR routes under `/courses/`
- **Practice exams** — interactive React islands with a backend (Supabase or similar)
- **Gear store** — product pages with Stripe or Shopify Storefront API integration
- **Newsletter** — email capture for new post notifications

Keep the content collection schemas, routing, and component architecture flexible enough to support these additions without major refactoring.