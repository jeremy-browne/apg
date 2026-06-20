// Public search endpoint backed by emdash's FTS5 full-text search.
// Runs on-demand (SSR) so it can query the live CMS database at request time.
export const prerender = false;

import type { APIRoute } from "astro";
import { search } from "emdash";

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get("q")?.trim() ?? "";

  // Require a couple of characters before hitting the index.
  if (q.length < 2) {
    return json({ results: [] });
  }

  // `search()` auto-injects the request-scoped emdash db and returns
  // { items: [{ collection, id, slug, title?, snippet?, score }] }.
  const { items } = await search(q, { collections: ["posts"], limit: 10 });

  const results = items.map((item) => ({
    title: item.title ?? "Untitled",
    // Mirrors Card.astro: post URLs are /blog/<slug ?? id>.
    url: `/blog/${item.slug ?? item.id}`,
    // snippet is already HTML-escaped by emdash with <mark> highlights.
    snippet: item.snippet ?? "",
  }));

  return json({ results });
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
