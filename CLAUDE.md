# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev       # Start dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview production build locally
npm run astro ... # Run Astro CLI (e.g. astro add, astro check)
```

Requires Node >= 22.12.0.

## Architecture

This is an [Astro](https://astro.build) project (v6) using the minimal template with strict TypeScript.

- `src/pages/` — file-based routing; `.astro` and `.md` files become routes
- `public/` — static assets served as-is
- `astro.config.mjs` — Astro configuration (currently default/empty)
- TypeScript config extends `astro/tsconfigs/strict`

Astro's component format (`.astro` files) uses a frontmatter fence (`---`) for server-side TypeScript, followed by HTML-like template markup.
