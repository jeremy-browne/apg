import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapURL: URL, llmsURL: URL, llmsFullURL: URL) =>
  `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}

# LLM content index (llmstxt.org)
# ${llmsURL.href}
# ${llmsFullURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  const llmsURL = new URL("llms.txt", site);
  const llmsFullURL = new URL("llms-full.txt", site);
  return new Response(getRobotsTxt(sitemapURL, llmsURL, llmsFullURL));
};
