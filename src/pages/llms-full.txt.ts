import type { APIRoute } from "astro";
import { getEmDashCollection, extractPlainText } from "emdash";
import { SITE_SETTINGS } from "../site.config";

function toTitleCase(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Post = { data: { priority?: number; publishedAt?: Date | null; slug?: string | null; title: string; category?: string; canonical?: boolean; content?: import("emdash").PortableTextBlock[]; id: string } };

function sortPosts<T extends Post>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const aPriority = a.data.priority ?? Infinity;
    const bPriority = b.data.priority ?? Infinity;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (b.data.publishedAt?.valueOf() ?? 0) - (a.data.publishedAt?.valueOf() ?? 0);
  });
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ? site.href.replace(/\/$/, "") : "https://aussiepilotguide.com";

  const { entries: allPosts } = await getEmDashCollection("posts", { status: "published" });
  const sorted = sortPosts(allPosts.filter((p) => p.data.canonical));

  const lines: string[] = [];

  lines.push(`# ${SITE_SETTINGS.title}: Full Content`);
  lines.push("");
  lines.push(`> ${SITE_SETTINGS.description}`);
  lines.push("");
  lines.push(`Site: ${siteUrl}`);
  lines.push("");

  for (const post of sorted) {
    const slug = post.data.slug ?? post.id;
    const pubDate = post.data.publishedAt?.toISOString().split("T")[0];
    const category = post.data.category ? toTitleCase(post.data.category) : null;

    lines.push("---");
    lines.push("");
    lines.push(`## [${post.data.title}](${siteUrl}/blog/${slug}/)`);

    const metaParts: string[] = [];
    if (pubDate) metaParts.push(`Published: ${pubDate}`);
    if (category) metaParts.push(`Category: ${category}`);
    if (metaParts.length) lines.push(metaParts.join(" | "));

    lines.push("");
    if (post.data.content) lines.push(extractPlainText(post.data.content));
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
