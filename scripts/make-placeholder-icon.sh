#!/bin/bash
# יוצר אייקון זמני 1024x1024 (דורש macOS sips + Python3+Pillow או ImageMagick)
# שימוש: ./scripts/make-placeholder-icon.sh
# עדיף להחליף באייקון מעוצב לפני חנות.

OUT=~/Sikret/mobile/assets/icon.png
mkdir -p "$(dirname "$OUT")"

if command -v magick >/dev/null 2>&1; then
  magick -size 1024x1024 xc:'#05060F' \
    -fill '#2DE2E6' -draw "rotate 45 rectangle 400,400 624,624" \
    "$OUT"
  echo "נוצר: $OUT"
  exit 0
fi

python3 << 'PY' 2>/dev/null || { echo "התקן Pillow: pip3 install pillow"; exit 1; }
from pathlib import Path
try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit(1)
p = Path.home() / "Sikret/mobile/assets/icon.png"
p.parent.mkdir(parents=True, exist_ok=True)
img = Image.new("RGB", (1024, 1024), "#05060F")
d = ImageDraw.Draw(img)
d.rectangle([360, 360, 664, 664], fill="#2DE2E6")
img.save(p)
print("נוצר:", p)
PY
