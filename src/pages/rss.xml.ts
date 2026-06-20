import rss from "@astrojs/rss";
import { getEmDashCollection, getTermsForEntries } from "emdash";
import type { APIContext } from "astro";

import { SITE_SETTINGS } from "../site.config";

export async function GET(context: APIContext) {
  const { entries } = await getEmDashCollection("posts", {
    status: "published",
    orderBy: { published_at: "desc" },
  });

  const entryIds = entries.map((e) => e.data.id);
  const tagsByEntry = await getTermsForEntries("posts", entryIds, "tag");

  return rss({
    title: SITE_SETTINGS.title,
    description: SITE_SETTINGS.description,
    site: context.site ?? "",
    items: entries.map((entry) => {
      const slug = entry.data.slug ?? entry.id;
      const tags = (tagsByEntry.get(entry.data.id) ?? []).map((t) => t.label);
      return {
        title: entry.data.title,
        pubDate: entry.data.publishedAt ?? entry.data.createdAt,
        description: entry.data.description ?? "",
        link: `/blog/${slug}/`,
        ...(entry.data.featured_image?.src && {
          enclosure: {
            url: entry.data.featured_image.src,
            type: "image/webp",
            length: 1,
          },
        }),
        ...(tags.length > 0 && { categories: tags }),
      };
    }),
    customData: `<language>en-au</language>`,
  });
}
