# Aussie Pilot Guide

An Australian flight training blog helping student pilots navigate their training journey — from first flight to first job.

Built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), and deployed on [Cloudflare Workers](https://workers.cloudflare.com).

## Getting started

```bash
npm install
npm run dev       # http://localhost:4321
```

## Commands

| Command               | Description                     |
|-----------------------|---------------------------------|
| `npm run dev`         | Start local dev server          |
| `npm run build`       | Production build to `dist/`     |
| `npm run preview`     | Preview the production build    |
| `npm run astro check` | TypeScript / Astro diagnostics  |

## Content

### Blog posts

Add `.md` files to `src/content/blog/`:

```yaml
---
title: "Your Post Title"
description: "One or two sentence summary."
pubDate: 2026-05-08
authors:
  - "Jeremy Browne"
tags: ["rpl", "ppl", "casa"]
draft: false
---
```

### Authors

Author profiles live in `src/content/authors/`. The filename must be the slugified form of the display name used in blog posts:

- `"Jeremy Browne"` → `src/content/authors/jeremy-browne.md`

```yaml
---
name: "Jeremy Browne"
role: "Commercial Pilot & Grade 3 Flight Instructor"  # optional
---

Bio in Markdown...
```

**Routing:**
- `/authors` — with one author, redirects to their profile; with multiple, shows a list ranked by article count
- `/authors/[slug]` — profile page with bio and article grid

**Missing profile warning:** if a post names an author with no matching file, `npm run build` and `npm run dev` emit a console warning and the name renders as plain text rather than a broken link.

**Adding a new author:** create the profile file, then use their display name in any post's `authors` array. The build handles the rest automatically.

### Images

Blog images go in `public/images/blog/`. Specs before committing:

- **Size:** 1600×900px (16:9)
- **Format:** WebP
- **Quality:** ~80% (under 300 KB)

Run `npm run optimise:image -- <input-path> [output-basename]` to convert to a spec-compliant WebP. Do not commit full-resolution originals.

## Configuration

Global settings, SEO metadata, and navigation links are in `src/site.config.ts`.

## Environment variables

For forms to work, add Turnstile keys to `.env`:

```bash
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAA...
TURNSTILE_SECRET_KEY=your_secret_here
```

## Project structure

```
src/
├── content/
│   ├── blog/           # Blog posts (.md)
│   └── authors/        # Author profiles (.md, filename = slug)
├── components/
├── layouts/
├── pages/
│   ├── authors/
│   │   ├── index.astro       # Author list / redirect (SSR)
│   │   └── [slug].astro      # Individual author profile (static)
│   └── blog/
│       ├── index.astro       # Blog listing (static)
│       └── [id].astro        # Blog post (static)
└── styles/
public/                 # Static assets (images, fonts, favicons)
```
