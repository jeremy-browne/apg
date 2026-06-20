// Import legacy markdown blog posts (src/content/blog/*.md) into the emdash CMS.
//
// emdash stores post bodies as PortableText, so each markdown body is converted
// with emdash's own `markdownToPortableText`. Featured images are uploaded to R2
// via the media API and referenced by id.
//
// Usage:
//   node scripts/import-posts.mjs --url <instance-url> --token <ec_pat_...> [options]
//   node scripts/import-posts.mjs --url ... --token ... --dry-run
//
// Options:
//   --url <url>        emdash instance base URL (e.g. https://aussie-pilot-guide.jbapp.workers.dev)
//   --token <token>    Admin API token (ec_pat_...). Or set EMDASH_TOKEN.
//   --dir <path>       Markdown source dir (default: src/content/blog)
//   --public <path>    Public dir for resolving image.src (default: public)
//   --draft            Import as drafts instead of publishing
//   --dry-run          Parse + convert + print payloads, but make no API calls
//
// Not yet handled (manual follow-up): author bylines and tags/category taxonomies.

import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { parse as parseYaml } from "yaml";
import { EmDashClient, markdownToPortableText } from "emdash/client";

const args = parseArgs(process.argv.slice(2));
const baseUrl = args.url;
const token = args.token ?? process.env.EMDASH_TOKEN;
const dir = args.dir ?? "src/content/blog";
const publicDir = args.public ?? "public";
const dryRun = Boolean(args["dry-run"]);
const asDraft = Boolean(args.draft);

if (!baseUrl || (!token && !dryRun)) {
  console.error(
    "Usage: node scripts/import-posts.mjs --url <instance> --token <ec_pat_...> [--dry-run] [--draft]",
  );
  process.exit(1);
}

const client = dryRun ? null : new EmDashClient({ baseUrl, token });

const MIME = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
};

const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
console.log(`Found ${files.length} markdown file(s) in ${dir}\n`);

let created = 0;
let failed = 0;

for (const file of files) {
  const slug = basename(file, ".md");
  try {
    const raw = readFileSync(join(dir, file), "utf8");
    const { frontmatter, body } = splitFrontmatter(raw);
    const fm = parseYaml(frontmatter) ?? {};

    const content = markdownToPortableText(body.trim());

    const data = {
      title: fm.title ?? slug,
      excerpt: fm.description ?? fm.summary ?? "",
      content,
    };
    if (fm.pubDate) data.publishedAt = toIso(fm.pubDate);
    if (fm.updatedDate) data.updatedAt = toIso(fm.updatedDate);

    // Featured image → upload to R2, reference by id.
    const imgSrc = fm.image?.src;
    if (imgSrc) {
      if (dryRun) {
        data.featured_image = { src: imgSrc, alt: fm.image?.alt ?? "" };
      } else {
        const media = await uploadImage(imgSrc, fm.image?.alt);
        if (media) data.featured_image = { id: media.id, alt: fm.image?.alt ?? "" };
      }
    }

    const status = asDraft || fm.draft ? "draft" : "published";

    if (fm.authors?.length) {
      console.warn(`  ⚠ ${slug}: authors ${JSON.stringify(fm.authors)} not imported (set bylines in admin).`);
    }
    if (fm.tags?.length || fm.category) {
      console.warn(`  ⚠ ${slug}: tags/category not imported (add via taxonomy in admin).`);
    }

    if (dryRun) {
      console.log(`[dry-run] would create posts/${slug} (status=${status}, ${content.length} blocks)`);
      console.log(`          ${JSON.stringify({ ...data, content: `<${content.length} PortableText blocks>` })}`);
      created++;
      continue;
    }

    const item = await client.create("posts", { data, slug, status });
    console.log(`✓ created posts/${slug} (id ${item.id}, ${status})`);
    created++;
  } catch (err) {
    failed++;
    console.error(`✗ ${slug}: ${err.message}`);
  }
}

console.log(`\nDone. ${created} created${dryRun ? " (dry-run)" : ""}, ${failed} failed.`);
if (failed > 0) process.exit(1);

// ---- helpers ----

async function uploadImage(src, alt) {
  // src is a site-absolute path like /images/blog/foo.webp → resolve under publicDir.
  const rel = src.replace(/^\//, "");
  const path = join(publicDir, rel);
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    console.warn(`  ⚠ image not found on disk: ${path} — skipping featured image.`);
    return null;
  }
  const ext = (src.split(".").pop() ?? "").toLowerCase();
  const media = await client.mediaUpload(new Uint8Array(bytes), basename(path), {
    alt: alt ?? "",
    contentType: MIME[ext] ?? "application/octet-stream",
  });
  return media;
}

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("no YAML frontmatter found");
  return { frontmatter: m[1], body: m[2] };
}

function toIso(value) {
  // Accept Date, ISO string, or YYYY-MM-DD.
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.valueOf()) ? undefined : d.toISOString();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}
