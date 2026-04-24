# Aussie Pilot Guide

An Australian flight training blog and resource site helping student pilots navigate their training journey — from first flight to first job.

## Tech stack

- **Framework:** Astro (content-first, static by default)
- **Content:** Markdown/MDX in `src/content/`
- **Styling:** Tailwind CSS
- **Interactive components:** React (used sparingly via Astro islands, only where interactivity is needed)
- **Deployment:** Cloudflare Pages (or Netlify/Vercel)
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
│   └── blog/         # Blog posts as .md/.mdx files
├── components/        # Astro and React components
│   ├── *.astro        # Static layout components
│   └── *.tsx          # Interactive React islands (client:load / client:visible)
├── layouts/           # Page layouts
├── pages/             # File-based routing
└── styles/            # Global styles
public/                # Static assets (images, fonts, favicons)
```

## Content conventions

### Blog posts

Blog posts live in `src/content/blog/` as Markdown files with YAML frontmatter:

```yaml
---
title: "How to Become a Pilot in Australia"
description: "A complete guide to pilot training pathways in Australia — RAAus, RPL, PPL, CPL and beyond."
pubDate: 2026-04-25
updatedDate: 2026-04-25
author: "Jeremy Browne"
category: "training-pathways"
tags: ["rpl", "ppl", "cpl", "casa", "raaus"]
draft: false
---
```

### Content categories

Use these categories to organise posts. New categories can be added but check existing ones first:

- `training-pathways` — licence types, RPC vs RPL, how to become a pilot
- `gear` — what to buy at each stage (student, PPL, CPL)
- `career` — getting your first job, industry outlook, pilot shortage
- `theory` — study tips, exam prep, aerodynamics explainers
- `operations` — flight planning, weather, airspace
- `lifestyle` — what training is actually like, day-in-the-life

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
- Images should use Astro's `<Image />` component for automatic optimisation.

## Future scope (do not build yet, but design with these in mind)

- **Online theory courses** — gated content with auth, likely SSR routes under `/courses/`
- **Practice exams** — interactive React islands with a backend (Supabase or similar)
- **Gear store** — product pages with Stripe or Shopify Storefront API integration
- **Newsletter** — email capture for new post notifications

Keep the content collection schemas, routing, and component architecture flexible enough to support these additions without major refactoring.