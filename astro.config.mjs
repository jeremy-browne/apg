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

// Canonical public origin. Drives Astro's `site` and emdash's `siteUrl`,
// which in turn defines the WebAuthn rpId for admin passkeys. Override at
// build time for non-production origins (e.g. a *.workers.dev preview) so
// passkeys work there — the rpId must match the origin the browser is on:
//   EMDASH_SITE_URL=https://<preview-host> npm run build
const siteUrl = process.env.EMDASH_SITE_URL ?? "https://aussiepilotguide.com";

// https://astro.build/config
export default defineConfig({
    output: "server",
    // Cloudflare adapter is only needed for production builds.
    // In dev, using it triggers @cloudflare/vite-plugin's Workers SSR environment,
    // which breaks virtual modules (e.g. virtual:astro-icon) via fetchModule.
    adapter: isDev ? undefined : cloudflare(),
    site: siteUrl,

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
        siteUrl,
        database: isDev
          ? sqlite({ url: "file:./emdash.db" })
          : d1({ binding: "DB" }),
        storage: isDev
          ? local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" })
          : r2({ binding: "MEDIA" }),
        plugins: [
          {
            id: "emdash-resend-email",
            version: "1.0.0",
            format: "standard",
            entrypoint: "./src/plugins/resend-email.ts",
            capabilities: ["hooks.email-transport:register"],
          },
        ],
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
      ssr: {
        // @astrojs/react's server entry statically imports the virtual module
        // `astro:react:opts`. In dev we run without the Cloudflare adapter, and
        // emdash's integration narrows ssr.noExternal, which leaves the React
        // renderer externalized — so Node's ESM loader (not Vite) loads it and
        // dies on the `astro:` scheme. Bundling it through Vite resolves the
        // virtual module. Harmless in production.
        noExternal: ["@astrojs/react"],
      },
    },
});
