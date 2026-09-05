#!/bin/bash
# Package the 清明上河圖·武漢 run into examples/qingming-wuhan/.
#   tools/package_example.sh /path/to/qingming-wuhan v11
# Needs Homebrew python3 with Pillow for the JPEGs. Does not run the loop or re-render anything.
set -e
SRC=${1:?usage: package_example.sh SOURCE_DIRECTORY vN}
V=${2:?usage: package_example.sh SOURCE_DIRECTORY vN}
DST="$(cd "$(dirname "$0")/.." && pwd)/examples/qingming-wuhan"
jpg(){ python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=90)" "$1" "$2"; }
mkdir -p "$DST/views" "$DST/iterations"

# wiki (every .md, proposals/, judges.json), src, reference, the two tool scripts
rsync -am --exclude .DS_Store --include '*/' --include '*.md' --include judges.json --exclude '*' "$SRC/wiki/" "$DST/wiki/"
rsync -a --exclude .DS_Store "$SRC/src/" "$DST/src/"
rsync -a --exclude .DS_Store --exclude full_original.jpg --exclude detail_original.jpg "$SRC/reference/" "$DST/reference/"   # the 38k-px Commons scan stays out; full_500.jpg and the windows are what the loop used
cp "$SRC/tools_render.sh" "$SRC/tools_assemble.sh" "$DST/"

# the final version: both html files, the 1:1 scroll, the eight fixed views, the two evolution sheets
cp "$SRC/iterations/$V/qingming-wuhan.html" "$SRC/iterations/$V/qingming-wuhan-preview.html" "$SRC/iterations/$V/full.png" "$DST/"
cp "$SRC/iterations/$V"/view-*.png "$DST/views/"
cp "$SRC/iterations/evolution.png" "$SRC/iterations/evolution-detail.png" "$DST/"

# every iteration v1..$V: the full scroll as JPEG (v1 and $V also as PNG) and the three review crops as JPEG
for n in $(seq 1 "${V#v}"); do
  d="$DST/iterations/v$n"; mkdir -p "$d"
  cp "$SRC/iterations/v$n/qingming-wuhan-preview.html" "$d/"
  jpg "$SRC/iterations/v$n/full.png" "$d/full.jpg"
  for k in detail-bridge-crowd detail-street process; do jpg "$SRC/review/v$n/$k.png" "$d/$k.jpg"; done
  if [ "$n" = 1 ] || [ "v$n" = "$V" ]; then cp "$SRC/iterations/v$n/full.png" "$d/"; fi
done
# The release carries the same p5 version locally; keep links portable on repackaging.
python3 - "$DST" <<'PYDEPS'
from pathlib import Path
import sys
root=Path(sys.argv[1])
for p in [root/'qingming-wuhan.html',root/'qingming-wuhan-preview.html',root/'src/head.html',*root.glob('iterations/v*/qingming-wuhan-preview.html')]:
    local='../../vendor/p5.min.js' if 'iterations' in p.parts else 'vendor/p5.min.js'
    p.write_text(p.read_text().replace('https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js',local))
PYDEPS
du -sh "$DST"
