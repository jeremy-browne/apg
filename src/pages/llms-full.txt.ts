import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE_SETTINGS } from "../site.config";

function toTitleCase(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sortPosts<T extends { data: { priority?: number; pubDate: Date } }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const aPriority = a.data.priority ?? Infinity;
    const bPriority = b.data.priority ?? Infinity;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ? site.href.replace(/\/$/, "") : "https://aussiepilotguide.com";

  const canonicalPosts = await getCollection(
    "blog",
    ({ data }) => !data.draft && data.canonical,
  );
  const sorted = sortPosts(canonicalPosts);

  const lines: string[] = [];

  lines.push(`# ${SITE_SETTINGS.title}: Full Content`);
  lines.push("");
  lines.push(`> ${SITE_SETTINGS.description}`);
  lines.push("");
  lines.push(`Site: ${siteUrl}`);
  lines.push("");

  for (const post of sorted) {
    const pubDate = post.data.pubDate.toISOString().split("T")[0];
    const category = post.data.category ? toTitleCase(post.data.category) : null;

    lines.push("---");
    lines.push("");
    lines.push(`## [${post.data.title}](${siteUrl}/blog/${post.id}/)`);

    const metaParts = [`Published: ${pubDate}`];
    if (category) metaParts.push(`Category: ${category}`);
    lines.push(metaParts.join(" | "));

    lines.push("");
    if (post.body) lines.push(post.body);
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
