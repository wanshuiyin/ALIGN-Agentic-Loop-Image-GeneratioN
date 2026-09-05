#!/bin/bash
# assemble qingming-wuhan.html (interfaces §4; callig.js is inline in head.html) and a doctype-wrapped preview copy
cd "$(dirname "$0")"
cat src/head.html src/core.js src/mod-arch.js src/mod-figure.js src/mod-boat.js src/mod-tree.js src/mod-water.js src/mod-ground.js src/mod-crowd.js src/mod-text.js src/main.js src/tail.js > qingming-wuhan.html
{ printf '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">'; cat qingming-wuhan.html; printf '</body></html>'; } > qingming-wuhan-preview.html
wc -c qingming-wuhan.html qingming-wuhan-preview.html
