"""
Resize and convert images to WebP for blog use.

Drop source images into the `images-to-process` folder, then run:
    python process_images.py

Each image is center-cropped to 16:9, resized to 1600×900, converted to
WebP at 80% quality, and moved to public/images/blog/.
"""

import sys
from pathlib import Path
from PIL import Image

SOURCE_DIR = Path("images-to-process")
OUTPUT_DIR = Path("public/images/blog")
TARGET_W, TARGET_H = 1600, 900
QUALITY = 80

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp", ".heic"}


def crop_to_16_9(img: Image.Image) -> Image.Image:
    target_ratio = TARGET_W / TARGET_H
    w, h = img.size
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Too wide — crop sides
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall — crop top and bottom
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))

    return img


def process(path: Path) -> None:
    img = Image.open(path)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img = crop_to_16_9(img)
    img = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)

    out_path = OUTPUT_DIR / (path.stem + ".webp")
    img.save(out_path, "WEBP", quality=QUALITY)

    kb = out_path.stat().st_size / 1024
    flag = " [!] over 300 KB" if kb > 300 else ""
    print(f"  {path.name} -> {out_path.name} ({kb:.0f} KB){flag}")


def main() -> None:
    SOURCE_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    sources = [p for p in SOURCE_DIR.iterdir() if p.suffix.lower() in SUPPORTED]

    if not sources:
        print(f"No images found in {SOURCE_DIR}/")
        sys.exit(0)

    print(f"Processing {len(sources)} image(s)...\n")
    errors = []

    for path in sorted(sources):
        try:
            process(path)
            path.unlink()
        except Exception as exc:
            errors.append((path.name, exc))
            print(f"  {path.name} — ERROR: {exc}")

    print()
    if errors:
        print(f"Done. {len(sources) - len(errors)} succeeded, {len(errors)} failed.")
    else:
        print(f"Done. All {len(sources)} image(s) written to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
