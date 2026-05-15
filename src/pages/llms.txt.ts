import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE_SETTINGS } from "../site.config";

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ? site.href.replace(/\/$/, "") : "https://aussiepilotguide.com";

  const blogPosts = await getCollection("blog", ({ data }) => !data.draft);
  blogPosts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const authors = await getCollection("authors");
  const aboutPages = await getCollection("about");

  const lines: string[] = [];

  lines.push(`# ${SITE_SETTINGS.title}`);
  lines.push("");
  lines.push(`> ${SITE_SETTINGS.description}`);
  lines.push("");
  lines.push(
    "Australian flight training blog covering CASA regulations, RAAus, licence pathways (RPC, RPL, PPL, CPL), theory exams, and life as a student pilot in Australia.",
  );
  lines.push("");

  lines.push("## Blog Posts");
  lines.push("");
  for (const post of blogPosts) {
    lines.push(`- [${post.data.title}](${siteUrl}/blog/${post.id}/): ${post.data.description}`);
  }
  lines.push("");

  if (aboutPages.length > 0) {
    lines.push("## About");
    lines.push("");
    for (const page of aboutPages) {
      const desc = page.data.description ?? "About the site and its author.";
      lines.push(`- [${page.data.title}](${siteUrl}/about/): ${desc}`);
    }
    lines.push("");
  }

  if (authors.length > 0) {
    lines.push("## Authors");
    lines.push("");
    for (const author of authors) {
      const role = author.data.role ? ` — ${author.data.role}` : "";
      lines.push(`- [${author.data.name}](${siteUrl}/authors/${author.id}/)${role}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
