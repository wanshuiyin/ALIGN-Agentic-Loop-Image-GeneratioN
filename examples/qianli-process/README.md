# 千里江山圖 · 過程

A 4185 × 500 p5.js re-creation of 王希孟《千里江山图》 — 绢本矿物设色 青绿山水, ten stages from 矾绢
to 云气·题跋 at 1 px ≈ 1 mm, a 4000 px 画心 (a third of the original's length, six to eight
mountain-and-water passages) and a 185 px 拖尾 carrying Cai Jing's 78-character colophon written
by a brush engine over font skeletons — the run that produced `/reference-art-loop`. It stopped at
v4.3 after two code reviews and eleven blind rounds with the gate not passed: the round-1 tell
"mountain geometry" was still on the board.

## Layout

| path | what it is |
|---|---|
| `qianli.html` | the page as it stood at v4.3 — open it directly |
| `src/` | `head3.html`, `gen3.js` (the whole generator), `callig.js` (brush engine), `tail3.js` (player, replay, WebM) |
| `wiki/` | `plan.md`, `reference.md`, `gates.md`, `decisions.md` (D-01–D-25), `review-log.md` (R1, R2, B1–B11) |
| `review/` | the last review set — `q3_left/mid/right/whole/zoom/water/colophon.png` — and `evolution.png`, twelve versions v1 → v4.3 under the reference, one row each |

## Trajectory

R = the reviewer read the code; B = blind, PNG paths only, opened with its own image tool.
Reviewer throughout: Codex gpt-5.6-sol. A whole-picture score exists only for B5–B9; from B10 the
question was whether the round-1 top three were still there.

| version | round | reviewer | score | what changed | what cleared |
|---|---|---|---|---|---|
| v1 | R1 | gpt-5.6-sol | — | first page | adopted: continuous 网巾纹, colour borders following peak lobes, radial 皴, 拖尾 colophon instead of a title; rejected its 石青 alpha (D-03) |
| v3 | R2 | gpt-5.6-sol | — | build-time randomness, occlusion tables, bridges landing on banks | rejected the global alpha drop (D-03) |
| v3.1 | B1 | gpt-5.6-sol | — | first blind round, four PNGs | nine tells ranked: vector-triangle mountains with altitude bands, 3–5 px blue ridge outline, scan-line 皴, graph-paper water, typeset colophon |
| v3.2 | B2 | gpt-5.6-sol | — | colophon, seals and title through the brush engine (D-07, D-08) | seals nearest to passing; "change one thing" → mountain construction |
| v3.3 | B3 | gpt-5.6-sol | 5 · 3 · 2 per tell | folded ridges with vein facets (D-09), calligraphy v2 (D-10) | lettering near handwritten — new: horizontal stripes in every pigment layer |
| v3.4 | B4 | gpt-5.6-sol | — | pigment from bands to dabs (D-11), contours broken by whole segments (D-12) | blue outline landed, pigment stripes gone |
| v3.5 | B5 | gpt-5.6-sol | 4.5 | curved ridge segments, stepped peak caps, multi-scale dabs (D-13, D-14) | — (the water's "brick wall" turned out to be a real bug) |
| v3.6 | B6 | gpt-5.6-sol | 5.8 | water segments no longer share endpoints (D-15), off-centre peaks with shoulders, 石青 without its dense core (D-16) | blue outline cleared; water reads as texture at viewing size |
| v3.7 | — | — | — | ridge jitter, saddle platforms, slope glazes (D-17) | no blind round |
| v3.8 | B7 | gpt-5.6-sol | 4.0 | calligraphy straightened on the user's veto (D-18); the reference crops supplied for the first time | the score fell because the reviewer finally had the original beside the render |
| v3.9 | B8 | gpt-5.6-sol | 4.0 | interlocking mountain groups, rounded peaks, ink bones, slope-stretched pigment, deeper warmer silk (D-19) | 山径, silk no longer dominant |
| v4.0 | B9 | gpt-5.6-sol | 3.5 | rock-block rewrite: fold lines, 皴 grown from folds, pigment per face, water blank (D-20) | colophon paper proportions right |
| v4.1 | B10 | gpt-5.6-sol | not asked | three ink grades, staggered back feet, unsegmented water tint (D-22); "blue top, green waist, ochre foot" rejected as a tell (D-21) | blue outline out of the top three for good |
| v4.2 | B11 | gpt-5.6-sol | not asked | ridge shoulders and notches, ripples within 30 px of shore, sediment enlarged (D-23) | — (sediment enlargement judged "blue bruises") |
| v4.3 | — | — | — | sediment reverted (D-24), title in 楷 and colophon columns recomputed from the paper width (D-25) | stopped |

## What holds

Confirmed twice by the reviewer: the layered colour order, near-far layering with hidden feet,
the rhythm of blank silk, staffage scale, the broken heavy-ink contour, a single water colour, and
a landscape one can walk through. Still on the board at the end: mountain bodies (from "canvas
tents" to "cones with shoulders"), the water's horizontal stripes, same-size colour blobs. The
next primitive, if the run resumes: mountains as overlapping rock masses, each with its own contour
and 皴, pigment following the mass rather than the altitude.

## Decisions worth quoting

**D-01** — 「播放进度 = 青绿山水的真实工序:矾绢 → 勾勒 → 皴擦 → 赭石 → 汁绿·水色 → 石绿 → 石青 →
水纹·远山 → 复勾·点景 → 云气·题跋。每道工序内笔触按 x 从右到左排序(手卷展读方向),所以能看到"笔锋"
扫过画面。」

**D-03** — the reviewer asked for thin 石青; the original is opaque impasto. 「审稿被驳回,理由:
参照物是原作而不是通用水墨趣味。」

**D-11** — horizontal stripes in every pigment layer came from the band primitive itself; dabs
replaced it. 「颜料团块的尺度要接近岩面尺度(几十像素),不是几像素。」

**D-13** — the water was right to keep and wrong in scale: 「网巾纹本应是 1–2px 一行的细密肌理,
不是看得见的线。」

**D-18** — the user's first look at the colophon: 「这个字怎么歪歪扭扭的」. Every deformation the
reviewer suggested had been applied at once. 「毛笔感来自墨量递减、笔压起伏、收锋、飞白,不来自把字
扭歪……字这类用户一眼就判的东西要早给用户看,不等盲评。」

**D-21** — the reviewer listed blue peaks, green slopes and ochre feet as a program tell; the
reference shows exactly that layering. Kept, with more variance per mountain instead.

## Open it, scrub it

Open `qianli.html` in Chrome or Edge (Ma Shan Zheng and Noto Serif SC load from Google Fonts;
the colophon uses Xingkai SC where installed, Ma Shan Zheng elsewhere). ▶ 播放 paints the ten
stages in 120 s at 1×; the slider scrubs; the ten stage buttons jump; 镜头自右向左展卷 makes the
viewport follow the brush; drag the scroll or the minimap; ● 一键录制 WebM records a play-through.
Backward scrubs replay from the stage-4 and stage-8 snapshots.

Deep links: `#p=0.45` progress 0–1 · `#cam=0.5` viewport, 0 = 拖尾 end, 1 = right end ·
`#seq=1,0.35,0.7,1` a scrub sequence (G-01 renders this against `#p=1` and expects 0 differing
pixels).

## Re-render

```
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1000,700 --virtual-time-budget=240000 --screenshot=q3_mid.png \
  "file://$PWD/qianli.html#p=1&cam=0.5"
```

Any Chromium works; swap the binary path.
