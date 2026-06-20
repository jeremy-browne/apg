// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { d1, r2 } from "@emdash-cms/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import expressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

const isDev = process.argv.some((arg) => arg === "dev");

// https://astro.build/config
export default defineConfig({
    output: "server",
    // Cloudflare adapter is only needed for production builds.
    // In dev, using it triggers @cloudflare/vite-plugin's Workers SSR environment,
    // which breaks virtual modules (e.g. virtual:astro-icon) via fetchModule.
    adapter: isDev ? undefined : cloudflare(),
    site: "https://aussiepilotguide.com/",

    fonts: [
      {
        provider: fontProviders.local(),
        name: "Inter",
        cssVariable: "--font-inter",
        options: {
          variants: [
            {
              src: ["./src/assets/fonts/Inter.woff2"],
              weight: "normal",
              style: "normal",
              display: "swap",
            },
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "JetBrainsMono",
        cssVariable: "--font-jet-brains-mono",
        options: {
          variants: [
            {
              src: ["./src/assets/fonts/JetBrainsMono.woff2"],
              weight: "normal",
              style: "normal",
              display: "swap",
            },
          ],
        },
      },
    ],

    integrations: [
      react(),
      emdash({
        siteUrl: "https://aussiepilotguide.com",
        database: isDev
          ? sqlite({ url: "file:./emdash.db" })
          : d1({ binding: "DB" }),
        storage: isDev
          ? local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" })
          : r2({ binding: "MEDIA" }),
      }),
      sitemap(),
      icon(),
      expressiveCode({
        plugins: [pluginLineNumbers()],
        themes: ["aurora-x"],
      }),
    ],

    markdown: {
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "wrap",
            properties: { className: ["anchor"] },
          },
        ],
      ],
    },

    vite: {
      plugins: [tailwindcss()],
    },
});
