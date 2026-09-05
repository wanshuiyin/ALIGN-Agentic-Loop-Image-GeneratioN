#!/bin/bash
# render the seven views + the full scroll into $1 (default review/); view-left = the colophon and 漢陽 shops, view-qingchuan = 晴川閣 and 龜山
OUT=${1:-review}; mkdir -p "$OUT"
EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
URL="file://$(pwd)/qingming-wuhan-preview.html"
render(){ "$EDGE" --headless=new --disable-gpu --hide-scrollbars --window-size=$3 --virtual-time-budget=240000 --screenshot="$OUT/$1.png" "$URL#$2" >/dev/null 2>&1; }
render view-bridge   "p=1&cam=0.577" 1000,700
render view-right    "p=1&cam=1"     1000,700
render view-hubuxiang "p=1&cam=0.901" 1000,700
render view-hanzhengjie "p=1&cam=0.259" 1000,700
render view-jianghanguan "p=1&cam=0.145" 1000,700
render view-left     "p=1&cam=0"     1000,700
render view-huanghelou "p=1&cam=0.727" 1000,700
render view-qingchuan "p=1&cam=0.465" 1000,700
render full          "full=1"        5300,560
ls -la "$OUT"
