#!/usr/bin/env bash
# Tạo bản web trong modern_image/web/ (~1600px, JPEG ~80%) — dùng cho thiệp online.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/modern_image"
OUT="$SRC/web"
mkdir -p "$OUT"

count=0
while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  out="$OUT/$base"
  echo "→ $base"
  sips -s format jpeg -s formatOptions 80 -Z 1600 "$f" --out "$out" >/dev/null
  count=$((count + 1))
done < <(find "$SRC" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo "Xong: $count ảnh → $OUT"
du -sh "$OUT"
