import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE_SETTINGS } from "../site.config";

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ? site.href.replace(/\/$/, "") : "https://aussiepilotguide.com";

  const blogPosts = await getCollection("blog", ({ data }) => !data.draft);
  blogPosts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const lines: string[] = [];

  lines.push(`# ${SITE_SETTINGS.title} — Full Content`);
  lines.push("");
  lines.push(`> ${SITE_SETTINGS.description}`);
  lines.push("");
  lines.push(`Site: ${siteUrl}`);
  lines.push("");

  for (const post of blogPosts) {
    const pubDate = post.data.pubDate.toISOString().split("T")[0];
    const updatedDate = post.data.updatedDate?.toISOString().split("T")[0];

    lines.push("---");
    lines.push("");
    lines.push(`# ${post.data.title}`);
    lines.push(`URL: ${siteUrl}/blog/${post.id}/`);
    lines.push(`Published: ${pubDate}`);
    if (updatedDate && updatedDate !== pubDate) lines.push(`Updated: ${updatedDate}`);
    if (post.data.tags.length > 0) lines.push(`Tags: ${post.data.tags.join(", ")}`);
    lines.push("");
    lines.push(post.data.description);
    lines.push("");
    if (post.body) lines.push(post.body);
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
