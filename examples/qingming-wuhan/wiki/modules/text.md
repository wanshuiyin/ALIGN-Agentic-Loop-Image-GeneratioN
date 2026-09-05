# mod-text.js · 招牌、幌子、匾、题跋

Files: `src/mod-text.js` (module `TEXT`), `src/scene-text.js` (self-check scene), `src/harness-text.html` (harness copy pointing at those two, with `CW:220` so the 拖尾 sheet exists and `Xingkai SC` added to the font gate), `review/module-text.png` (the harness rendered at device scale 2, 2600×1520; canvas origin at page (102,151) in the round-2 render, 2 px per canvas px). Contract reference: `wiki/interfaces.md` §2(h), §3. Deviations from interfaces.md are marked **≠**.

## Public functions

```
TEXT.footprint(ctx, spec)                → {x0,y0,x1,y1,z,inside}      pure; the board/cloth rectangle + 1 px
TEXT.sign(ctx, spec)                     → {fp, slots:{tx,ty}}          readable 楷 board (≤ 14 in the scroll)
TEXT.blob(ctx, spec)                     → {fp, slots:{}}               unreadable 6–9 px sign as brush-ink mass
TEXT.huangzi(ctx, spec)                  → {fp, slots:{}}               = blob with style 'fan', 4×30 default
TEXT.colophon(ctx, spec)                 → {cols, colGap, x0, y0, bottom}
TEXT.collectorSeals(ctx, spec?)          → undefined
```

`sign`, `blob`, `huangzi` push `{kind, text?, fp}` into `ctx.reg.slots`.

**≠** interfaces §3 gives `TEXT` only `sign` and `colophon`. `footprint`, `blob`, `huangzi`, `collectorSeals` are added: boards and cloth banners occlude what stands behind them, so they need a footprint like every other object; the unreadable signs are a different mark from the readable ones and get their own function; the collector seals were listed as an integrator call in §4 and are now one line.

### `sign(ctx, {x, y, text, size, vertical, style, board, z, w, h})`

| field | does |
|---|---|
| `x, y` | **centre** of the board (or of the text block when there is no board). A 幌子 centre = its hang point + h/2. |
| `text` | the characters; must be one of `SIGN_TEXTS` (font gate). Horizontal boards are laid out **right → left** (the string is reversed before `brushText`), the scroll's own reading direction; vertical boards top → bottom. |
| `size` | character size, 12–20 for readable boards (default 14). Pitch is 1.25·size horizontal, 1.12·size vertical. |
| `vertical` | `true` → one column. Default `false`. |
| `style` | `'bian'` 匾 horizontal board (default when horizontal); `'pai'` 牌 vertical hanging board with a header strip (0.5·size) and a tie 5–9 px up to the eave (default when vertical); `'fan'` 幡/幌子 cloth banner on a pole (free-hand sagging edges, swallow-tail hem); `'plain'` characters only, e.g. on a 牌坊 lintel. |
| `board` | `'ink'` (default): outer ruler line 0.8/200, inner moulding line 0.5/150 at inset ≤ 2.4, and the band between laid as 淡墨 dabs (`wash`, ink 0.3); `'zhusha'`: the same band in 朱砂 (ink 0.62) — for 幌子 a ≤ 0.9 px 朱砂 strip along both long edges; `false`: no frame (the arch module drew it). |
| `z` | **the host building's z + 2** (default `y`). With +2 the board's stamp hides the wall lines under it (`hidden` is `Z > z+1`), and figures nearer than the building hide the board and its text. Text dabs on hidden cells are dropped at build time. |
| `w, h` | override the board size. Default: 匾 = textW + size, textH + 0.6·size (江漢關 at 18 → 81×29); 牌 = size·1.45 wide, textH + 0.9·size + header (蔡林記 at 13 → 19×60). |
| `dx, dy` | (round 2) where the characters sit relative to the board centre: dx to the right, dy **up**. Left unset, `sign` settles them once per board — rr(−3,3) and rr(1,2) — and writes them back onto the spec. The board rectangle and the footprint do not move; only the text does. |
| `ink` | ink load of the characters, default 0.9, uniform within a board (round 3; round 2's per-board rr(0.85,0.95) is gone — the board's off-centre placement carries the hand, the load does not vary). |
| `tight` | (round 2) `true` → pitch ×0.93: this one sign-writer crowded his characters. Give it to one board per street. |

`brushText` settings: font `"Kaiti SC","STKaiti","KaiTi","Noto Serif SC"`, over 5, dry 0, warp 0, tilt 0, wander 0, SS 6, ink 0.9; pitch per the `tight` field. Frame in `JIEHUA`, 淡墨/朱砂 band in `INDIGO`, characters in `FINISH`. Insets shrink with the board's short side (0.1 / 0.2 of it, capped at 1.2 / 2.4) so an 8-px board keeps an interior. Ruler-line corners get ±0.25 px jitter per stroke; `rline`'s own overshoot and end dwell do the rest.

### `blob(ctx, {x, y, w, h, style, board, z, n, vertical})`

Unreadable sign. `w,h` default per style (`pai` 8×24, `bian` 24×8, `fan` 4×30, `plain` 7×7); `vertical` defaults to `h > w`; `style` defaults to `'pai'`; `board` as for `sign`. `n` pseudo-characters (default: cloth `round(along/7.5)`, boards `round(along/(gs·1.3))`, clamped **2–4** since round 2) are laid down the long axis inside the frame's insets; glyph size `gs` = 0.9 × the short interior side, 2.4–9 px, ×rr(0.9,1.04) per character.

Round 2: the characters are of unequal weight. One of them (random index) is written heavy — weight 1.15–1.4, applied as radius^0.6 and alpha^0.5 — and the others at 0.7–1.0, so a 幌子 or 牌 reads as two to four dark marks of different loads, not one even smear. Base dab alpha 0.8 under 3.5 px, 0.72 above.

Each pseudo-character is 2–3 horizontal bars (rising 1–3° to the right, as 楷 does), 1–2 verticals and, 65 % of the time, a 撇 or 捺. Every stroke is a run of dabs 0.55 px apart, radius `max(0.28, gs·0.085)` × 1.3 at the entry (顿), tapering to ×0.55 over the last quarter, alpha ≈ 0.66 (0.78 under 3.5 px) × a per-sign tone that fades 4 % per character (the brush running out), with a dry gap of 8–20 % of the length on 40 % of the strokes longer than 2.5 px. Stamped through `ctx.brush.stampDabs` in `FINISH`, one stroke object per character, hidden cells dropped.

### `huangzi(ctx, {x, y, w, h, z, board, n})`

`blob` with `style:'fan'`: pole (ruler line 0.75, 6–12 px past the cloth toward the wall), two ties, batten, two `bline` long edges bowing ±0.7 px, hem cut in a V of 0.35·w, vertical blob inside; `board:'zhusha'` adds the 朱砂 strips.

### `colophon(ctx, {text, x, y, size, perCol, colGap, seals, sealSize})`

| field | does |
|---|---|
| `text` | the 跋 (pass `COLOPHON`). **≠** punctuation and spaces are stripped before layout — a 跋 carries none; the plan's 75 chars become 62. |
| `size` | 18 default. |
| `perCol` | 14 default → `cols = ceil(len/perCol)` (62 → 5 columns: 14·4 + 6). |
| `colGap` | requested gap (24); actual = `min(colGap, (CW − 60 − size)/(cols − 1))` so every column stays 30 px inside both paper edges (D-25). At CW=220 and 5 columns the 24 stands; 7 columns would shrink it to 23.7. |
| `x, y` | centre of the first character; default `CW − 30 − size/2`, `30 + 0.6·size`. |
| `seals` | two strings below the last column, default `SEAL_TEXTS[0..1]` = 取法 / 不取景. Sizes `sealSize` (20) and −2, 9–13 px under the last character, offset ±1.5 px from the column axis so they do not line up. |

| `grid` | ignored since round 11: there is no 界格 any more (B10 ⑥ 「放大图能看见淡方格」). The sheet under the columns is bare. |

**Round 2 — written, not set; round 3 — dried along the stroke.** Each character is its own `brushText` call (`wetChar`) with the brush's state at that moment. The ink load runs down each column segment (0.95 → 0.78 over the run, the last one or two characters before a re-dip a further step paler); at one character 40–60 % down the column (`ri(round(0.4m), round(0.6m))`) the brush is dipped and the run starts wet again. Dryness no longer drops random dabs across the glyph (B2 tell 8 「missing granules」): the engine's own `dry` is held at 0.08 and `over` stays 6, so every character keeps its full dab count except for a single fibre gap that opens on one side of the tail of the longer strokes in the last one or two characters before a re-dip — capped at a fifth of the character's dabs. Otherwise dryness is a paling: a mild overall lowering of alpha and a stronger fade over the last third of every stroke (dabs are in writing order within a stroke, so the fade follows the brush), a whole movement that runs out of ink rather than an eroded glyph. Sizes ×0.94–1.06 per character, pitch ×0.94–1.06 per step, the last character of a column 1–2 px high. Columns stay vertical (B2: 「Plumb columns are not a fault」): `brushText` gets wander .3, warp .012, tilt .8, dir −1, SS 6.

No z: the paper is outside the z-mask (`hidden` is always true there, so filtering would erase it). Font: the same `KAI` stack as the boards, `"Kaiti SC","STKaiti","KaiTi","Noto Serif SC"` (round 7; rounds 2–6 used `"Xingkai SC","Ma Shan Zheng"`, which B6 read as 行楷).

### `collectorSeals(ctx, {x, texts})`

`SEAL_TEXTS[2]` (珍藏, 24 px) in the upper right corner at `x = SW − 36`, y 22–30, and `SEAL_TEXTS[3]` (審定, 19 px) in the lower right corner, x offset +1…+4, y `SH − 44…52` — 画心两端上下角, not aligned.

## Footprint shape

`footprint(ctx, spec)` runs the same layout as the build and returns the board or cloth rectangle padded by 1 px, `z = spec.z` (default `spec.y`), `inside` = axis-aligned box test. For `'plain'` it is the text block + 0.2·size. The pole of a 幌子 and the tie of a 牌 are lines and are not in the footprint. The integrator stamps it in phase A like any other footprint — pass the same spec to `footprint` and to `sign/blob`; for `huangzi` pass `{x,y,w,h,z,style:'fan'}` to `footprint`.

## Stages

`DRAFT` none · `JIEHUA` board lines, inner moulding, header divider, tie, pole, ties, batten, cloth edges, hem · `INDIGO` 淡墨 or 朱砂 frame band · `FINISH` characters, blob ink, seals. Colour is always inside the ink frame and laid as dabs (`wash`), never as a filled rectangle. Stroke-object sort keys: rightmost x of the mark; characters in a column carry `−0.01·row` so a stable sort writes them top to bottom, and reversed horizontal text fires right → left, the writing order.

## Harness and render

```
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1300,760 --force-device-scale-factor=2 --virtual-time-budget=60000 \
  --screenshot=review/module-text.png "file:///Users/rfy_naiveai/Desktop/qingming-wuhan/src/harness-text.html"
```

`scene-text.js`: three bare shopfronts (ruler lines, 直棂窗, 板门, 赭石 wall wash, 淡墨 under the eave), then 江漢關 (匾 18, 朱砂), 蔡林記 (牌 13, vertical), 熱乾麵 (匾 14, ink), six blobs (two 幌子 — one 朱砂-edged —, two 8×24 牌, one 24×8 匾, one plain 22×7 on the wall), a 58-px figure whose footprint is stamped nearer than the 幌子 behind it, the plan's colophon on the 220-px sheet with 取法 / 不取景, and the collector seals at `SW − 36`. Font probe (`scratchpad/fontprobe.png`): Kaiti SC, STKaiti, Xingkai SC and the Google Ma Shan Zheng all resolve in headless Edge; `KaiTi` falls back to a sans and is only there for other platforms.

## What the render showed, what changed

First render, read at 2×:

- Characters upright on all three boards; 楷 clean with dab granularity at the edges; 匾 reads 關漢江 from the left as intended. The 匾 hides the two lintel lines and the window's top corner behind it; the wall wash leaves its face blank; the figure's head cuts the 幌子 and its blob — the z-mask path works for lines, dabs and text.
- Colophon: five columns, rightmost at x 181, leftmost at 85, both ≥ 30 px inside the sheet; 行楷 shows load variation and dry ends; the two seals sit under 其法不取其景, slightly off-axis.
- Collector seals in Ma Shan Zheng, 印泥 half-transparent with chipped edges.
- **Wrong:** the 朱砂 frame band was a ruled `rline` at alpha 150 — a perfectly even red rectangle, the one thing in the frame that read as computer-drawn. **Changed:** the band (朱砂 or 淡墨) is now four thin quads washed with `ctx.wash` (step/rad ≈ 0.6·band width, floor 0.7), so it is granular pigment inside the ink line with the wash's own holes and pooling.
- **Wrong:** fixed 1.2 / 2.4 px insets left a 24×8 匾 with a 3-px interior and its three blob characters squashed. **Changed:** insets scale with the short side (0.1 / 0.2 of it, capped), and blob insets follow them.
- **Wrong:** the plain 7-px blob on the wall was two thin scratchy marks, far lighter than the reference's small-sign ink (劉家上色沉檀揀香 in `style_city.png` is a column of heavy dark masses with horizontal-bar structure). **Changed:** three horizontal bars 65 % of the time, two verticals 55 %, a diagonal 65 %; dab alpha 0.58 → 0.66 (0.78 under 3.5 px); base radius 0.075 → 0.085·gs; character count from `along/(gs·1.3)` instead of `·1.6`, cloth banners default to `along/7.5` characters.

Second render (`review/module-text.png`): the 朱砂 band is uneven and stays inside the frame, the small boards keep an interior with two or three dark characters, the wall blob reads as three heavy small characters. Nothing else moved.

### Round 2 (B1 lettering tells: colophon 「set, not written … every glyph has nearly the same grey load」, boards 「mathematically centred」)

Render at 4× of the two right columns: 丙午清明後 fades to a dry 後, 一日以張 is the re-dip (heavy, full contact), 擇端筆法寫 dries again with broken strokes and open fibres in 法寫; column two the same with 蛇山 as the dip. The 界格 lies under the columns as a faint ruling and reads as the sheet, not as a table (alpha 25 on the paper is at the edge of visibility at 1×, plain at 2×). Boards: 熱乾麵 sits visibly right of and above its board centre, 四季美 at 12 and 豆皮 at 11 (vertical 牌) beside 蔡林記 at 13 mix three sizes on one street, 熱乾麵 is the tight one. The 幌子 shows four marks with the second heavy; the 24×8 匾 blob three marks with the right one dark. Scene: two blobs replaced by the 豆皮 and 四季美 boards (`scene-text.js`).

## For the integrator

- Every string `sign` rasterises must be in `SIGN_TEXTS`; seal strings in `SEAL_TEXTS`; the colophon is `COLOPHON`. Nothing in this module adds text of its own.
- Phase A: `ctx.masks.stampZ(TEXT.footprint(ctx, spec))` for every sign, blob and 幌子 with `z = building.z + 2` (a sign on a boat: `boat.z + 2`). Phase B: the same specs to `TEXT.sign / blob / huangzi`; then `TEXT.colophon(ctx,{text:COLOPHON})` and `TEXT.collectorSeals(ctx)`.
- Arch's `signRect` slot can be `{x, y, w, h}` with centre coordinates and go straight in; if arch draws the board itself, pass `board:false` and only the characters are written.
- Round 2, main.js's side of the board tells: sizes 11–14 mixed within one street (not one size per street), `vertical:true` on two of the 14 boards, `tight:true` on one; the off-centre placement and the per-board ink need nothing from main.js. The same spec object must go to `footprint` and `sign` (it already does).

### Round 3 (B2 tell 8: 「much of its dryness reads as missing granules … carry wet-to-dry behaviour along actual strokes」)

Render `review/module-text-colophon-2x.png` (2× of the whole 跋): every character is complete in all five columns; 丙午清明後 pales into 後, 一日以 is the re-dip at full load, 張擇端筆法寫 runs down to a pale, thin-tailed 法寫 with a hairline opening in the long strokes of 寫; column two the same with 山黃 as the dip and 戶部 pale at the foot; the ends of columns three to five (聲耳, 其景) read as the brush giving out, not as chipped glyphs. The 界格 is a suggestion of ruling at 2×, not seen at 1×. Boards: 熱乾麵 / 豆皮 / 蔡林記 at one even load each, still sitting off their board centres. Nothing else moved; the seals are untouched (B2's 「red interiors flat」 is `ctx.sealStamp` in core).

### Round 7 (B6 lettering tell: 「字势实际偏行楷,尚不是所称的端楷」; D-14 跋文字体换端楷)

One constant changed: `wetChar` now writes with the boards' `KAI` stack (`"Kaiti SC","STKaiti","KaiTi","Noto Serif SC"`) instead of `"Xingkai SC","Ma Shan Zheng"`; the `XING` constant is gone. Nothing else in `colophon` moved — per-character wet-to-dry load, re-dip points, the fibre gap before a re-dip, sizes, pitch, 界格, seal positions are as in round 3. Render `review/module-text-colophon-2x.png` and `review/module-text-colophon-cols-2x.png` (two right columns): 端楷 with square 横 entries and pressed 捺, 丙午清明後 paling, 一日以 the re-dip at full load, 法寫 pale at the foot; column two the same with 山黃 the dip. Columns plumb, every character complete. The harness font gate no longer needs `Xingkai SC` (its extra `fonts.load` is harmless and left in place); `tail.js` already loads `"Kaiti SC"` on `ALL_TEXT`, so the integrator's gate covers the colophon without change.

### Round 11 (B10 tell ⑥: 「放大图能看见淡方格,字距齐,重复字的姿态又近。先去掉可见底格,再调整整列字的大小、欹正与间距」; D-21 (2))

Four changes in `colophon` / `wetChar`, the boards untouched:
- **No 界格.** The DRAFT ruling (verticals between columns, top and bottom rule) is gone; `grid` is ignored. The 拖尾 sheet under the columns is bare paper.
- **Size drifts, pitch follows the ink.** Within a column the character size runs ×0.9–1.1 on a slow wave (one swell per 5–9 characters, phase per column, ±0.015 tremor per character). Each column is written at y = 0 first, every character's ink extent (top and bottom dab, tilt included) is measured, and the column is then laid out so that each character begins `size × 0.20–0.30` below the lowest stroke of the one before it (floor: 0.8 × the previous character's size from centre to centre). A short character (一, 日 after it) is followed sooner, a tall one (寫, 擔) holds the next one off; the column has a rhythm instead of a ruler's step. Column length 14 characters ≈ 255–275 px (was 252), the block still ends well inside the sheet.
- **欹正.** The engine is given `tilt: 0` and the finished character is turned about its own centre by `lean` = ±0.35–0.8° (D-18's 0.8° ceiling kept), the sign alternating per character, so neighbours lean slightly against each other instead of each drawing an independent random tilt. `wetChar(ctx,ch,x,y,size,ink,dry,lean)` — `lean` undefined keeps the old engine behaviour.
- **Repeated characters.** A character that recurs in the 跋 (江 ×3, 漢 ×3, 取 ×2, 法 ×2, 其 ×2, 水 ×2, 山 ×2) is written with its load shifted by ∓7–11 % on each recurrence (alternating darker / paler), on top of the column's own wet-to-dry run, so no two 江 or 漢 carry the same grey.
Unchanged: re-dip points, the dry paling and the fibre gap before a re-dip, the last character of a column 1–2 px high, `wander 0.3 / warp 0.012`, plumb columns, seal positions (`ly` from the last item's laid-out y), the return shape `{cols,colGap,x0,y0,bottom}`. Nothing in main.js changes (`TEXT.colophon(ctx,{text:COLOPHON})`).

Render `review/module-text.png` (harness at device scale 1 this round; canvas origin (51,75)), crops `review/module-text-colophon-2x.png` (whole 跋, 2×) and `review/module-text-colophon-cols-3x.png` (two right columns, 3×): no ruling anywhere on the sheet; 丙午清明 evenly stepped, 後一日 small and close, 以張擇端筆 swelling larger with wider steps, 法寫 pale at the foot; column two 武漢兩江東湖 tight, 春水蛇山 opening, 黃鶴戶部 smaller and pale; every character complete, columns plumb, the ±0.8° lean not visible as slant at 3× (as D-18 intends — only as characters that do not all stand identically).
