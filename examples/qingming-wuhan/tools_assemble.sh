#!/usr/bin/env bash
set -euo pipefail

# Assemble qingming-wuhan.html (interfaces §4; callig.js is inline in
# head.html) and a doctype-wrapped preview copy. Build into temporary files so
# a missing source fragment cannot replace the last good pages.
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd -- "$script_dir"

body_tmp="$(mktemp "$script_dir/.qingming-wuhan.html.XXXXXX")"
preview_tmp="$(mktemp "$script_dir/.qingming-wuhan-preview.html.XXXXXX")"
cleanup() {
  rm -f -- "$body_tmp" "$preview_tmp"
}
trap cleanup EXIT

cat src/head.html src/core.js src/mod-arch.js src/mod-figure.js src/mod-boat.js src/mod-tree.js src/mod-water.js src/mod-ground.js src/mod-crowd.js src/mod-text.js src/main.js src/tail.js > "$body_tmp"
{
  printf '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">'
  cat -- "$body_tmp"
  printf '</body></html>\n'
} > "$preview_tmp"

mv -- "$body_tmp" qingming-wuhan.html
mv -- "$preview_tmp" qingming-wuhan-preview.html
trap - EXIT
wc -c qingming-wuhan.html qingming-wuhan-preview.html
