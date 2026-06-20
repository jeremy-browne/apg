import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getEmDashCollection } from "emdash";
import { SITE_SETTINGS } from "../site.config";

function toTitleCase(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Post = { data: { priority?: number; publishedAt?: Date | null; slug?: string | null; title: string; summary?: string; description?: string; category?: string; canonical?: boolean; id: string } };

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
  const canonicalPosts = allPosts.filter((p) => p.data.canonical);

  const authors = await getCollection("authors");
  const aboutPages = await getCollection("about");

  const grouped = new Map<string, typeof canonicalPosts>();
  const uncategorised: typeof canonicalPosts = [];

  for (const post of sortPosts(canonicalPosts)) {
    const cat = post.data.category;
    if (cat) {
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(post);
    } else {
      uncategorised.push(post);
    }
  }

  const lines: string[] = [];

  lines.push(`# ${SITE_SETTINGS.title}`);
  lines.push("");
  lines.push(`> ${SITE_SETTINGS.description}`);
  lines.push("");
  lines.push(
    "Australian flight training blog covering CASA regulations, RAAus, licence pathways (RPC, RPL, PPL, CPL), theory exams, and life as a student pilot in Australia.",
  );
  lines.push("");

  for (const [category, posts] of grouped) {
    lines.push(`## ${toTitleCase(category)}`);
    lines.push("");
    for (const post of posts) {
      const slug = post.data.slug ?? post.id;
      const desc = post.data.summary ?? post.data.description ?? "";
      lines.push(`- [${post.data.title}](${siteUrl}/blog/${slug}.md): ${desc}`);
    }
    lines.push("");
  }

  if (uncategorised.length > 0) {
    lines.push("## Blog Posts");
    lines.push("");
    for (const post of uncategorised) {
      const slug = post.data.slug ?? post.id;
      const desc = post.data.summary ?? post.data.description ?? "";
      lines.push(`- [${post.data.title}](${siteUrl}/blog/${slug}.md): ${desc}`);
    }
    lines.push("");
  }

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
      const role = author.data.role ? `: ${author.data.role}` : "";
      lines.push(`- [${author.data.name}](${siteUrl}/authors/${author.id}/)${role}`);
    }
    lines.push("");
  }

  lines.push(`Full content version: [llms-full.txt](${siteUrl}/llms-full.txt)`);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
