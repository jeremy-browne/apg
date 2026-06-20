import type { APIRoute } from "astro";
import { getEmDashEntry, extractPlainText } from "emdash";

export const GET: APIRoute = async ({ params, site }) => {
  const { id } = params;
  const { entry, error } = await getEmDashEntry("posts", id!);

  if (!entry || error) {
    return new Response("Not found", { status: 404 });
  }

  const siteUrl = site ? site.href.replace(/\/$/, "") : "https://aussiepilotguide.com";
  const pubDate = entry.data.publishedAt?.toISOString().split("T")[0];
  const updatedDate = entry.data.updatedAt?.toISOString().split("T")[0];
  const slug = entry.data.slug ?? entry.id;

  const lines: string[] = [];
  lines.push(`# ${entry.data.title}`);
  lines.push(`URL: ${siteUrl}/blog/${slug}/`);
  if (pubDate) lines.push(`Published: ${pubDate}`);
  if (updatedDate && updatedDate !== pubDate) lines.push(`Updated: ${updatedDate}`);
  if (entry.data.bylines?.length) {
    lines.push(`Authors: ${entry.data.bylines.map((c) => c.byline.displayName).join(", ")}`);
  }
  lines.push("");
  if (entry.data.description) lines.push(entry.data.description);
  lines.push("");
  if (entry.data.content) lines.push(extractPlainText(entry.data.content));

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
