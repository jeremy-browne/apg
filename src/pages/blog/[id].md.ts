import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const { post } = props;
  const siteUrl = site ? site.href.replace(/\/$/, "") : "https://aussiepilotguide.com";
  const pubDate = post.data.pubDate.toISOString().split("T")[0];
  const updatedDate = post.data.updatedDate?.toISOString().split("T")[0];

  const lines: string[] = [];
  lines.push(`# ${post.data.title}`);
  lines.push(`URL: ${siteUrl}/blog/${post.id}/`);
  lines.push(`Published: ${pubDate}`);
  if (updatedDate && updatedDate !== pubDate) lines.push(`Updated: ${updatedDate}`);
  if (post.data.authors.length > 0) lines.push(`Authors: ${post.data.authors.join(", ")}`);
  if (post.data.tags.length > 0) lines.push(`Tags: ${post.data.tags.join(", ")}`);
  lines.push("");
  lines.push(post.data.description);
  lines.push("");
  if (post.body) lines.push(post.body);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
