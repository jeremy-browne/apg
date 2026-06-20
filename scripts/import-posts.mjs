// Import legacy markdown blog posts (src/content/blog/*.md) into the emdash CMS.
//
// emdash stores post bodies as PortableText, so each markdown body is converted
// with emdash's own `markdownToPortableText`, then written through EmDashClient
// (which formats rich-text fields for the API). Featured images are uploaded to
// R2 via the media API; author names become bylines; frontmatter `tags` and
// `category` become taxonomy terms.
//
// Usage:
//   node scripts/import-posts.mjs --url <instance> --token <ec_pat_...> [options]
//   node scripts/import-posts.mjs --url <instance> --dry-run
//
// Options:
//   --url <url>        emdash instance base URL
//   --token <token>    Admin API token (ec_pat_...). Or set EMDASH_TOKEN.
//   --dir <path>       Markdown source dir (default: src/content/blog)
//   --public <path>    Public dir for resolving image.src (default: public)
//   --draft            Import as drafts (skip the publish step)
//   --dry-run          Parse + convert + print, but make no API calls
//
// Re-runnable: existing posts are not recreated, but their taxonomy terms are
// re-applied (term assignment replaces, so it's idempotent).

import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { parse as parseYaml } from "yaml";
import { EmDashClient, markdownToPortableText } from "emdash/client";

const args = parseArgs(process.argv.slice(2));
const baseUrl = (args.url ?? "").replace(/\/$/, "");
const token = args.token ?? process.env.EMDASH_TOKEN;
const dir = args.dir ?? "src/content/blog";
const publicDir = args.public ?? "public";
const dryRun = Boolean(args["dry-run"]);
const asDraft = Boolean(args.draft);
const refresh = Boolean(args.refresh); // re-convert + update content (and featured) on existing posts

if (!baseUrl || (!token && !dryRun)) {
  console.error("Usage: node scripts/import-posts.mjs --url <instance> --token <ec_pat_...> [--dry-run] [--draft]");
  process.exit(1);
}

const client = dryRun ? null : new EmDashClient({ baseUrl, token });

const MIME = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", avif: "image/avif" };
const bylineCache = new Map();
const termCache = new Map(); // `${taxonomy}:${slug}` -> termId

// Ensure the custom `featured` field (homepage pin order) exists on posts.
if (!dryRun) {
  try {
    await client.createField("posts", { slug: "featured", type: "number", label: "Featured", required: false });
  } catch { /* already exists */ }
}

// Existing posts (slug -> id) so re-runs don't duplicate but still backfill terms.
const existing = new Map();
if (!dryRun) {
  for (const status of ["published", "draft"]) {
    try {
      const res = await client.list("posts", { status, limit: 100 });
      for (const it of res.items ?? []) if (it.slug) existing.set(it.slug, it.id);
    } catch { /* best effort */ }
  }
}

const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
console.log(`Found ${files.length} markdown file(s) in ${dir}\n`);

let created = 0, updated = 0, failed = 0;

for (const file of files) {
  const slug = basename(file, ".md");
  try {
    const raw = readFileSync(join(dir, file), "utf8");
    const { frontmatter, body } = splitFrontmatter(raw);
    const fm = parseYaml(frontmatter) ?? {};

    let postId = existing.get(slug);

    if (!postId && !dryRun) {
      // ---- create the post (content, image, bylines, dates) ----
      const data = {
        title: fm.title ?? slug,
        excerpt: fm.description ?? fm.summary ?? "",
        content: mdToBlocks(body.trim()),
      };
      const imgSrc = fm.image?.src;
      if (imgSrc) {
        const media = await uploadImage(imgSrc, fm.image?.alt);
        if (media) data.featured_image = { id: media.id, alt: fm.image?.alt ?? "" };
      }
      const bylines = [];
      for (const name of fm.authors ?? []) {
        const id = await resolveByline(name);
        if (id) bylines.push({ bylineId: id });
        else console.warn(`  ⚠ ${slug}: byline "${name}" could not be resolved.`);
      }

      if (fm.featured != null) data.featured = Number(fm.featured);

      const input = { data, slug };
      if (fm.pubDate) input.publishedAt = toIso(fm.pubDate);
      if (bylines.length) input.bylines = bylines;

      const item = await client.create("posts", input);
      if (!asDraft && !fm.draft) await client.publish("posts", item.id);
      postId = item.id;
      console.log(`✓ created posts/${slug} (id ${postId}${asDraft || fm.draft ? ", draft" : ", published"})`);
      created++;
    } else if (postId && refresh && !dryRun) {
      // ---- refresh body content (and featured) on an existing post ----
      const cur = await client.get("posts", postId);
      const data = { ...cur.data, content: mdToBlocks(body.trim()) };
      if (fm.featured != null) data.featured = Number(fm.featured);
      await client.update("posts", postId, { data, _rev: cur._rev });
      if (!asDraft && !fm.draft) await client.publish("posts", postId);
      console.log(`↻ refreshed posts/${slug}`);
      updated++;
    } else if (postId) {
      updated++;
    }

    // ---- taxonomy terms (tags + category) for new AND existing posts ----
    const tagNames = Array.isArray(fm.tags) ? fm.tags : [];
    const categoryNames = fm.category ? [fm.category] : [];

    if (dryRun) {
      console.log(`[dry-run] posts/${slug}: tags=[${tagNames.join(", ")}] category=[${categoryNames.join(", ")}]`);
      if (!postId) created++;
      continue;
    }

    const tagN = await applyTerms(postId, "tag", tagNames, slug);
    const catN = await applyTerms(postId, "category", categoryNames, slug);
    console.log(`• posts/${slug}: assigned ${tagN} tag(s), ${catN} category`);
  } catch (err) {
    failed++;
    console.error(`✗ ${slug}: ${formatError(err)}`);
  }
}

console.log(`\nDone. ${created} created, ${updated} updated, ${failed} failed${dryRun ? " (dry-run)" : ""}.`);
if (failed > 0) process.exit(1);

// ---- markdown -> PortableText (table-aware) ----

// emdash's markdownToPortableText has no GFM table support (it turns rows into
// literal "| a | b |" paragraphs). Split the body around tables: pass prose
// runs through markdownToPortableText, and convert tables to emdash `table`
// blocks (rendered by emdash/ui's Table.astro).
function mdToBlocks(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let buffer = [];
  const flush = () => {
    if (buffer.join("").trim()) blocks.push(...markdownToPortableText(buffer.join("\n")));
    buffer = [];
  };
  for (let i = 0; i < lines.length; i++) {
    if (isTableRow(lines[i]) && !isSeparatorRow(lines[i]) && isSeparatorRow(lines[i + 1] ?? "")) {
      flush();
      const tableLines = [lines[i], lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j])) tableLines.push(lines[j++]);
      blocks.push(buildTableBlock(tableLines));
      i = j - 1;
    } else {
      buffer.push(lines[i]);
    }
  }
  flush();
  return blocks;
}

function splitRowCells(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}
function isTableRow(line) {
  return typeof line === "string" && line.includes("|") && line.trim().length > 0;
}
function isSeparatorRow(line) {
  if (!isTableRow(line) || !line.includes("-")) return false;
  return splitRowCells(line).every((c) => /^:?-+:?$/.test(c));
}

// Function declaration (hoisted) so the top-level await loop can call it
// before this point in the module without hitting a TDZ error.
function ptKey() {
  return `t${Math.random().toString(36).slice(2, 10)}`;
}

// Reuse emdash's inline parser for cell content (bold, links, code) by running
// the cell text through markdownToPortableText and lifting the spans/markDefs.
function cellContent(text) {
  const blk = markdownToPortableText(String(text).trim())[0];
  return {
    content: blk?.children ?? [{ _type: "span", _key: ptKey(), text: String(text).trim(), marks: [] }],
    markDefs: blk?.markDefs ?? [],
  };
}
function makeRow(cells, isHeader) {
  return {
    _type: "tableRow",
    _key: ptKey(),
    cells: cells.map((text) => {
      const { content, markDefs } = cellContent(text);
      return { _type: "tableCell", _key: ptKey(), isHeader, content, markDefs };
    }),
  };
}
function buildTableBlock(tableLines) {
  const header = splitRowCells(tableLines[0]);
  const bodyLines = tableLines.slice(2); // skip header + separator
  const rows = [makeRow(header, true), ...bodyLines.map((l) => makeRow(splitRowCells(l), false))];
  return { _type: "table", _key: ptKey(), hasHeaderRow: true, rows };
}

// ---- helpers ----

async function applyTerms(postId, taxonomy, values, slug) {
  if (!postId || values.length === 0) return 0;
  const ids = [];
  for (const value of values) {
    const id = await resolveTerm(taxonomy, value);
    if (id) ids.push(id);
    else console.warn(`  ⚠ ${slug}: ${taxonomy} term "${value}" could not be resolved.`);
  }
  // De-duplicate (e.g. "RPL" and "rpl" resolve to the same term).
  const unique = [...new Set(ids)];
  if (!unique.length) return 0;
  const res = await fetch(`${baseUrl}/_emdash/api/content/posts/${encodeURIComponent(postId)}/terms/${encodeURIComponent(taxonomy)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ termIds: unique }),
  });
  if (!res.ok) throw new Error(`assign ${taxonomy} failed: ${res.status} ${(await res.text()).slice(0, 160)}`);
  return unique.length;
}

// Create or look up a taxonomy term; returns its id or null. Cached.
async function resolveTerm(taxonomy, value) {
  const slug = slugify(value);
  const key = `${taxonomy}:${slug}`;
  if (termCache.has(key)) return termCache.get(key);
  let id = null;
  try {
    // createTerm returns { term: { id, ... } }.
    const res = await client.createTerm(taxonomy, { slug, label: String(value) });
    id = res?.term?.id ?? res?.id ?? null;
  } catch {
    // Already exists — look it up. terms() returns { terms: [...] }.
    try {
      const res = await client.terms(taxonomy, { limit: 200 });
      const items = res?.terms ?? res?.items ?? [];
      id = items.find((t) => t.slug === slug)?.id ?? null;
    } catch { /* best effort */ }
  }
  termCache.set(key, id);
  return id;
}

async function uploadImage(src, alt) {
  const path = join(publicDir, src.replace(/^\//, ""));
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    console.warn(`  ⚠ image not found on disk: ${path} — skipping featured image.`);
    return null;
  }
  const ext = (src.split(".").pop() ?? "").toLowerCase();
  return client.mediaUpload(new Uint8Array(bytes), basename(path), {
    alt: alt ?? "",
    contentType: MIME[ext] ?? "application/octet-stream",
  });
}

async function resolveByline(name) {
  if (bylineCache.has(name)) return bylineCache.get(name);
  const slug = slugify(name);
  let id = null;
  try {
    const res = await fetch(`${baseUrl}/_emdash/api/admin/bylines`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slug, displayName: name }),
    });
    if (res.ok) {
      const b = await res.json();
      id = b.data?.id ?? b.id ?? null;
    } else {
      const list = await fetch(`${baseUrl}/_emdash/api/admin/bylines?search=${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (list.ok) {
        const d = await list.json();
        const items = d.data?.items ?? d.items ?? [];
        id = items.find((x) => x.slug === slug || x.displayName === name)?.id ?? null;
      }
    }
  } catch { /* best effort */ }
  bylineCache.set(name, id);
  return id;
}

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("no YAML frontmatter found");
  return { frontmatter: m[1], body: m[2] };
}

function toIso(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.valueOf()) ? undefined : d.toISOString();
}

function formatError(err) {
  const parts = [err.message];
  if (err.status) parts.push(`status=${err.status}`);
  if (err.code) parts.push(`code=${err.code}`);
  if (err.details) parts.push(`details=${JSON.stringify(err.details)}`);
  return parts.join(" ");
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}
