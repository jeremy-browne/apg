// Optimise a blog header image to the site's spec: 16:9, 1600x900, WebP, ~80% quality.
// Usage: node scripts/optimise-image.mjs <input-path> [output-basename]
// Output: public/images/blog/<output-basename>.webp (basename defaults to input stem).

import { basename, extname, join } from "node:path";
import { stat } from "node:fs/promises";
import sharp from "sharp";

const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 900;
const QUALITY = 80;
const MAX_BYTES = 300 * 1024;
const OUT_DIR = "public/images/blog";

const [inputPath, outNameArg] = process.argv.slice(2);

if (!inputPath) {
  console.error("Usage: node scripts/optimise-image.mjs <input-path> [output-basename]");
  process.exit(1);
}

const outName = outNameArg ?? basename(inputPath, extname(inputPath));
const outPath = join(OUT_DIR, `${outName}.webp`);

try {
  const { width, height } = await sharp(inputPath).metadata();

  await sharp(inputPath)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: QUALITY })
    .toFile(outPath);

  const { size } = await stat(outPath);
  const kb = (size / 1024).toFixed(0);

  console.log(`✓ ${inputPath} (${width}x${height}) -> ${outPath}`);
  console.log(`  ${TARGET_WIDTH}x${TARGET_HEIGHT} WebP, q${QUALITY}, ${kb} KB`);

  if (width < TARGET_WIDTH || height < TARGET_HEIGHT) {
    console.warn(`  ⚠ source smaller than ${TARGET_WIDTH}x${TARGET_HEIGHT}; image was upscaled and may look soft.`);
  }
  if (size > MAX_BYTES) {
    console.warn(`  ⚠ ${kb} KB exceeds the 300 KB target; consider lowering quality.`);
  }
} catch (err) {
  console.error(`✗ Failed to optimise ${inputPath}: ${err.message}`);
  process.exit(1);
}
