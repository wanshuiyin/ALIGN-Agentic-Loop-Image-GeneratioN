# Plan — ALIGN Figure 1, as it stands at v7

The figure now in `iterations/v7.png` / `v7.svg`, and in `ALIGN/docs/figure1.png` / `figure1.svg` under both READMEs' H1. v7 is v6 with one change, the project's name in the title strip; no blind thread has read either (`review-log.md`, 收官). This file is the current design; **why** any of it is so is in `decisions.md`, which is the only place old choices live. Craft claim and what is taken from the style source: `reference.md`. Content the figure must carry: `method.md`. Gates: `gates.md`.

One program, one owner — `src/figure.html` with `src/p5.min.js`, `src/p5.svg.js` and `src/thumbs/showcase.jpg` beside it. Canvas and SVG viewBox **1800 × 1000**, read at **900 CSS px**.

**Hard rule.** No image-generation model of any kind, no diffusion, no Codex image tool. Every pixel is drawn by the p5.js program from the units below; the one exception is the showcase strip, a resize of ALIGN's own program-rendered 武汉 scroll. The silk is a colour, not a texture: no grain, no raster ground.

**What the reader must tell back**, from `method.md`, in order: (1) the executor studies the style windows and writes the specification — plan and interfaces — into the wiki; (2) module owners write the program against the contract, the program renders the views and the process sheet, with no image model anywhere; (3) a blind reviewer from another model family sees pixels and style windows, never the code; (4) the verdict is written into the wiki — accepted back into the program, overruled by the reference, reverted to a kept version — and the user's look decides last; (5) the program is repainted and the next round starts from program + wiki, never from pixels. **The three facts**: no image model; two model families and the reviewer never sees the code; state = (program, wiki), pixels never cross a round. The rule panel states the stop; the version row and the strip state what a run leaves behind.

## Palette by role (hex; nothing coloured for decoration)

| role | value |
|---|---|
| page ground | **#d9cbb0** |
| stage bands, all three, and nothing else | **#cdbc9c** |
| paper — the fill of every panel and every drawn sheet | **#ece2cc** |
| ink — main flow, outlines, titles, icons, legend labels | **#2b2620** |
| 淡墨 — audit trace, revert, the version line, secondary icon lines, band outlines, eave wash, the struck X | ink at **α 0.45–0.6** (icons 0.6; band outline 0.5; eave wash 0.14 / 0.08 / 0.04) |
| 赭石 — repaint loop, its label, **accept** | **#a8703e** |
| 花青 — overrule loop, its label, the word **reference** | **#4a6a86** |
| 朱砂 — the seal's field, and the 9-px seal at the 卷宗 colophon's foot | **#b0392a** |
| 石绿 — the two ✓ in the rule panel | **#5f9a6e** |
| 白文 — the carved 「判」 | **#efe6d0** at α 0.94 |

One tint for all three bands: they are told apart by number, title and the page between them, never by hue. No gradient; the eave wash is three translucent rules. Frame: 淡墨 1 px hairline at the canvas edge.

## Type — two faces, four sizes

- **楷** (band and panel titles, 程序即画, 取其法,不取其景, the caption): `"Kaiti SC","STKaiti","Noto Serif SC","Songti SC","Noto Serif CJK SC",serif`. Regular only — Kaiti has no bold and synthetic bold is a tell.
- **Humanist sans** (ALIGN, the tagline, every English subtitle, label and tag, the legend, the rule panel): `"Optima","Seravek","Gill Sans","Source Sans 3","Fira Sans","Lucida Grande","Helvetica Neue",Helvetica,sans-serif`, with the 楷 stack appended so a CJK glyph inside a sans run falls to 楷.
- **Seal face** (the 白文 only): `"Heiti SC","PingFang SC","Songti SC","Noto Sans SC",sans-serif` at 600.
- Sizes: **52** sans bold (ALIGN) · **36** 楷 (band titles; 程序即画) · **28** 楷 (panel titles) and sans bold (the rule panel's stop line) · **22** everything else, sans or 楷. **Nothing smaller than 22.** The seal's 「判」 is a graphic at 84.
- **Bold** is ALIGN, the repaint label and the stop line. **Italic** is the tagline, the repaint label and the seal's three exit words. *Two bold Latin runs besides ALIGN now sit on the page, and no blind reading has judged that arrangement* — D-27 took the bold off the DRIVE/ACQUIT sentence to stop it taking the eye's third landing, and D-31 (4) then gave bold to the stop line above it.
- Arrows inside text — Study → Specification, ✓ user → stop, 评分 3.5 → 7.0 — are **drawn** brush arrows in a measured gap between two runs, never U+2192.
- Before any text: `document.fonts.load` for each face with the final strings; then look for fallback glyphs in 判 · 卷宗 · 程序即画 · the caption, and check the SVG's `font-family` once per build.

## Word list — 70 English tokens, held exactly, no reserve

| where | English (counted) | 楷 / CJK |
|---|---|---|
| title strip | ALIGN · Agentic Loop Image GeneratioN · the program is the painting · without diffusion, anywhere (13) | 程序即画 |
| band titles | Study · Specification · Blind Loop · Outputs (5) | 1 · 研究与规格 · 2 · 盲评循环 · 3 · 产出 |
| band 1 | style windows · plan.md · interfaces.md · reference · executor · Claude (7) | 风格源 · 研究 / 取其法,不取其景 · 规格 |
| band 2 | module owners · no image model · views · process · reviewer · Codex · never the code · wiki · decisions · accept · overrule · revert · user (18) | 模块 · 程序 · 渲染 · 盲评 · 判 · 卷宗 |
| band 3 | replayable page · versions · every version kept (6) | 可重放页 · 版本 |
| arrows | program + wiki, never pixels · one version per round (8) | — |
| legend | flow · repaint · overrule · audit (4) | — |
| rule panel | reviewer · user · stop · a loop can DRIVE, cannot ACQUIT (9) | — |
| showcase | — (0) | 清明上河图·武汉,11 版 11 轮盲评,评分 3.5 → 7.0;另一卷 千里江山图·意临,12 版 11 轮 |

Total **70**, the ceiling. Band digits, ·, +, v1 / v11 and the caption's numerals are marks, not words. **Nothing is added without a cut of the same size named in the same decision.** The last exchange spent the rule panel's two ✗ → ✓ example lines (14 words) on the role tags, the three exit words, the version line and the version row's caption.

## Vertical rhythm

| region | y | notes |
|---|---|---|
| title strip | 20–74 | one line, baseline 60 |
| band 1 | 82–256 (174) | flow y **185**; panels 124–246 |
| gap | 256–268 | the overrule drops through it at x 1595 |
| band 2 | 268–550 (282) | flow y **407**; panels 312–502; audit lane **516**, repaint lane **536** |
| gap | 550–598 | revert's seam **560**, the version lane **578** |
| band 3 (x 240–1160) and the rule panel (x 1200–1760) | 598–782 (184) | panels 642–768; the version row 690–704 |
| gap | 782–794 | |
| showcase strip | 794–940 | legend beside it, x 36–216 |
| caption | baseline 980 | 楷 22; bottom margin 20 |

Bands x **240–1760** (band 3 to 1160), square corners, tint #cdbc9c, 淡墨 1 px outline. Left of them the gutter x 0–240 holds the executor and the legend and nothing else. Band titles at x 262: 楷 36 「N · 名」 then the English in sans 22 on the same baseline after 24 px (baselines 114 / 300 / 630).

## Title strip

**ALIGN** sans bold 52 at x 40, baseline 60 · **:** 28 · **Agentic Loop Image GeneratioN** sans 28 · 「程序即画」楷 36, baseline 58 · *the program is the painting · without diffusion, anywhere* sans italic 22 at α 0.8, baseline 58. The x positions are measured at build with 4 / 16 / 30 / 30 px gaps. The name is the one the READMEs now carry; D-15 (1) had written it 「ALIGN · Agentic Loop Image Generation」, and v7 is that change and nothing else.

## Panel construction

Paper fill #ece2cc, **square corners**. Ink `rule` outline 1.5 px on the two sides and the bottom. The **eave** is a 横 at 3 px from corner to corner (no overhang), with a 淡墨 wash of three 2-px rules at y+2 / y+5 / y+8 at α 0.14 / 0.08 / 0.04 under it — the shadow under a 檩, not a drop shadow. Title 楷 28 centred, baseline top+32; subtitle sans 22 at α 0.85 centred, baseline top+56; the icon area below. Families:

- **step** — as above.
- **gate** (盲评) — a second 1.1-px rule 4 px inside the outline on all four sides.
- **store** (卷宗) — a 淡墨 ledger rule 10 px under the eave, full inner width.
- **verdict** — not a panel: the seal.
- **rule panel** — a step panel outside any band, with no title row.

Widths follow content; heights follow the icon per band: 122 · 190 · 126.

## The seal

Square **120**, centre **(1332, 407)**, rotated **−2°** at build. Field 朱砂 at α 0.86, corner radius 2; an inset square 4 px in, offset −3 / +2, at α 0.25 for the denser paste. Three rim nibbles in the band tint on the rim (top at 30 % r 4, right at 60 % r 3, bottom at 75 % r 5). The 白文 「判」 in the seal face at 84, #efe6d0 α 0.94 with a 2-px stroke of its own colour to even the bars, +2 px optical drop. The flow attaches to the rotated square's left and right edges at y 407; the three exits leave its bottom and top edges at their own x. Fills and text only — no gradient, no raster.

## Band 1 · 1 · 研究与规格 · Study → Specification

Panels 124–246; title baseline 156, subtitle 180, icon area from 190. Icons in 白描: ink 2.0 px primary, 淡墨 1.4 px at α 0.6.

| panel | x | family | title / subtitle | illustration |
|---|---|---|---|---|
| 风格源 | 262–462 | step | 「风格源」/ style windows | two framed 绢 windows 62 × 40 — back at (326, 190) carrying one faint peak, front at (336, 198) carrying the full three-peak mountain with a 淡墨 water line; frame = ink rule + 淡墨 inner rule 3 px inset (裱边) |
| 研究 | 506–706 | step | 「研究」/「取其法,不取其景」(楷 22) | a ruler 120 × 14 at (546, 220) with 淡墨 ticks every 8 px, and a divider standing on it, hinge at (606, 192) |
| 规格 | 750–1030 | step | 「规格」/ plan.md · interfaces.md | two stitched booklets 60 × 42, back at (852, 190), front at (866, 194): cover rule, four 淡墨 stitch marks down the left edge, a 淡墨 ruled table 3 × 4 inside |
| reference | glyph 1560–1630 × 168–218 | — | **reference** sans 22 花青, right-aligned to x 1548, baseline 200 | one framed 绢 window 70 × 50 with the same mountain as 风格源's front window — the reference *is* the style source |

**Executor**, in the gutter: a 毛笔 held diagonally, handle top (96, 130) to tip (150, 206), the 笔头 a tapered bulb with 淡墨 hatching, over a keyboard 114 × 28 at (76, 210) with three rows of 淡墨 key ticks; the tip touches the keyboard's top edge. The main flow leaves at (200, 185) and crosses band 1's outline into 风格源.

Between 规格 (1030) and the reference glyph (1560) the band stays empty.

## Band 2 · 2 · 盲评循环 · Blind Loop

Panels 312–502; title baseline 344, subtitle 368, icon area from 380. The densest band and the 2× diagnostic view.

| panel | x | family | title / subtitle | illustration |
|---|---|---|---|---|
| 模块 | 262–438 | step | 「模块」/ module owners | the 规格 booklet again at (282, 418), scaled to 40 wide — the contract the owners build against — and four motifs in 40-px cells at (330, 388) 屋顶, (378, 388) 舟, (330, 436) 树, (378, 436) 水: several owners, each a module of the painting |
| 程序 | 482–668 | step | 「程序」/ no image model | a code sheet 70 × 96 at (540, 386): page rule, `</>` in three ink strokes, six 淡墨 ruled lines of unequal length, two indented |
| 渲染 | 712–908 | step | 「渲染」/ views · process | a framed 绢 window 92 × 62 at (764, 380) holding the arched bridge with its rail, posts, a boat and water; a 淡墨 box marks the crown. Under it at y 454: the process sheet as a 44 × 26 grid at x 758, and the crown at 2× in a 44 × 26 window at x 818 |
| 盲评 | 952–1192 | **gate** | 「盲评」/ reviewer · Codex (α 0.45) | one scene: a standing figure 976–1030 (head r 9 at (1002, 394), a robe widening to the hem, one arm out) holding a magnifier — lens r 18 at (1079, 448) over the arch — above a framed 绢 window **70 × 48** at (1044, 420) holding the bridge, the reference glyph's size; to the right a code sheet 42 × 54 at (1128, 384) **struck out** by a 淡墨 X; tag **never the code** sans 22 centred x 1072, baseline 486 |
| 判 | seal 1272–1392 × 347–467 | verdict | 白文 「判」 | see *The seal* |
| user | eye 52 × 34 centred (1480, 407), on A8 | actor glyph | **user** sans 22 ink α 0.45 centred x 1480, baseline 381 | an ink almond, iris r 8.5, pupil, a 淡墨 lid arc; filled opaque in the band tint so the flow stops at its left edge and resumes at its right |
| 卷宗 | 1555–1745 | **store** | 「卷宗」/ wiki · decisions | a hand-scroll 150 × 60 at (1575, 400): two rollers 10 × 60 with knobs, the open sheet between them with 淡墨 top and bottom rules, four vertical 淡墨 colophon columns, a **9-px 朱砂 seal at the foot of the leftmost** (the verdict written in), and the arch at the scroll's open end |

## Band 3 · 3 · 产出 · Outputs

Tint x 240–1160. Panels 642–768; title baseline 674, subtitle 698, icon area from 708.

| panel | x | family | title / subtitle | illustration |
|---|---|---|---|---|
| 可重放页 | 262–552 | step | 「可重放页」/ replayable page | a scroll unrolling leftward: sheet 300–500 at y 708–748 with a curl at its free left edge, roller 10 × 52 at x 500; on the sheet, one passage of the 武汉 scroll — a bridgehead roof at the left, the arched bridge with rail, posts and a boat under it, a second boat coming, water. A 淡墨 scrub bar at y 758 from x 300 to 500 with an ink knob at x 420 |
| 版本 | 596–856 | step | 「版本」/ versions | three frames 68 × 46 at x 612 / 692 / 772, y 708 — the same window, more in it each time: **v1** ground and the arch's contour · **v6** the bridge with one boat · **v11** bridge, two boats, two trees, water, three figures |

**The version row** — band 3's right half, once empty, now carries the run's record: eleven 14-px squares with 8-px gutters from x 891 to 1125, centred on x 1008 at y 690–704; the first ten paper with a 1.5-px ink rule, the eleventh solid ink. Under the ends, **v1** and **v11** sans 22 at α 0.85, baseline 728; centred under the row, **every version kept**, baseline 760.

## Rule panel

x **1200–1760**, y **598–782**, a step panel outside any band, no title row.

- **The main sentence**, baseline 684, centred on x 1480, sans **bold 28**: a drawn 石绿 ✓ · **reviewer** · **·** · a drawn 石绿 ✓ · **user** · a drawn brush arrow · **stop**. The ✓ are brush strokes (a short down-stroke into a long up-stroke) and the → an inline brush arrow; neither is a glyph.
- **The note**, baseline 730, centred, sans 22 ink α 0.85: **a loop can DRIVE, cannot ACQUIT** — why one tick cannot end the run.
- Nothing else. The ✗ → ✓ example lines are gone; the consequence they pictured is now drawn at the seal, where each outcome has its own labelled path to its own destination. `crossMark()` stays in the program, unused.

## Bottom row

- **Legend**, unboxed, x 36–216, rows at y 792 / 832 / 872 / 912: a sample stroke from x 44 to 104 ending in its head, label sans 22 ink at x 118 (baseline row+7): **flow** (ink 5, head 18) · **repaint** (赭石 3.5, head 12) · **overrule** (花青 dashed 3, head 12) · **audit** (淡墨 2, head 10). No header.
- **Showcase strip**: `src/thumbs/showcase.jpg` (3040 × 321, the whole 武汉 scroll v11) at x **240–1760**, y **794–940**, uniform scale, clipped to its rectangle, embedded as a data URI at build; a 淡墨 1-px mounting rule 4 px outside it (236–1764, 790–944). The only raster on the page.
- **Caption**, one line, 楷 22 ink at x 240, baseline 980: **清明上河图·武汉,11 版 11 轮盲评,评分 3.5 → 7.0;另一卷 千里江山图·意临,12 版 11 轮** — 评分 names what the numbers measure, 另一卷 makes the second run a second scroll and not this strip's right end; the → is drawn.

## Role tags

Three blind readings asked who acts. One tag per actor, all at sans 22, ink α 0.45, so they read as a family and not as more labels:

| tag | where |
|---|---|
| **executor · Claude** | under the 毛笔 and keyboard, centred x 130, baseline 262 |
| **reviewer · Codex** | the 盲评 panel's subtitle line — the only subtitle set paler than α 0.85 |
| **user** | above the eye, centred x 1480, baseline 381 |

## Brush primitives

- `brush(pts, w, colour, alpha, style)` — **one stroke is one filled outline**: the two offset edges of its width profile, closed, with round caps at the true ends. Never a chain of stroked pieces. Styles: `brush` (a thin 起笔 swelling to 1.6 w over the first fifth, an even body, a 收笔 to 0.08 w, and a **折** — a 1.35× press easing in over 2 w and out over 3 w — at each corner) · `heng` (the eave: a 顿 at both ends, body 0.95) · `line` (icon work: 1.12 → 1.0, ±8 % body, a 收笔 to 0.55) · `pie` (the head's strokes and the ✗) · `dash` (a 顿 of ≈ 1.2 w, then a taper to a point — one direction) · `rule` (constant width, stroked: panel outlines, ticks, the scrub bar, the ledger rule — not the tell).
- A **break** inside a stroke is a flat cut with the profile running on unbroken behind it, so a line passing behind another loses no pressure.
- `head(apex, ang, L, w)` — a short filled brush wedge with bowed shoulders, an uneven heel and one pointed exit, at 0.85 × L. Not a two-撇 chevron.
- `KIND`: flow 5 px ink · repaint 3.5 px 赭石 · overrule 3 px 花青 dashed 10 / 8 · audit 2 px ink α 0.6. Dash lengths vary 0.8–1.3×, gaps 0.6–1.6×, seeded at build.
- One seeded PRNG (seed 7) consumed at build in unit order; `draw()` makes no random or compositional choice (G-01).

## Arrows — every one, kind, route, label

| # | kind | from → to | route | label |
|---|---|---|---|---|
| A1–A3 | flow | executor (200, 185) → 风格源 → 研究 → 规格 | horizontal at y 185; A1 crosses band 1's outline | — |
| A4–A6 | flow | 模块 → 程序 → 渲染 → 盲评 | horizontal at y 407 | — |
| A7 | flow | 盲评 (1192) → the seal's left edge | 80 px, the verdict's own space | — |
| A8 | flow | the seal's right edge → 卷宗 (1555) | 163 px, blank between the eye's edges (±32 of 1480) | — (**user** is the eye's tag) |
| A9 | repaint | 卷宗's bottom (1700, 502) → down to 536 → left to 575 → up into 程序's bottom | broken where revert drops at x 1364 | **program + wiki, never pixels** 赭石 bold italic 22 in a gap centred x 1000, baseline 542 |
| A10 | repaint, no head | the seal's bottom at x 1300 → down to the repaint lane | accept re-enters the program by the repaint's own route, so the two are one path | **accept** 赭石 italic 22, right-aligned to 1292, baseline 500 |
| A11 | audit | the seal's bottom at x 1364 → down to the seam 560 → left to 770 → up into 版本's top | crosses A9's lane, which breaks for it | **revert** ink α 0.6 italic 22 at x 1372, baseline 500 |
| A12 | overrule | the reference glyph's bottom (1595, 218) → down through the 1/2 gap to 286 → left to 1332 → down onto the seal's top | dashed, above band 2's panels | **overrule** 花青 italic 22 at x 1344, baseline 330 |
| A13 | audit | 盲评's bottom (1120, 502) → down to 516 → right to 1640 → up into 卷宗's bottom | above A9's lane, rising left of its drop; broken where accept and revert pass | — (read from the legend, five rounds running) |
| A14 | audit | 卷宗's bottom (1730, 502) → down to the version lane 578 → left to 820 → up into 版本's top | outside A9's drop; lands right of revert's, so the two record paths never cross | **one version per round** ink α 0.6 sans 22 in a gap centred x 1050, baseline 584 |

The main flow still carries no arrow between bands — the numbers carry the sequence. **Band 3 is now entered**, by the verdict's two records: revert to a kept version, and one version per round from the wiki. Every path is fixed at build from the panel rectangles and the seal's rotated edges; nothing is routed at draw time.

## Occlusion, in the order the program produces it

frame → band tints, outlines and titles → panels (paper, eave wash, outline, family rule, title, subtitle), the seal, the eye's opaque fill → arrows (over the tints, under nothing but the eye; heads at panel edges) → 白描 icons and the version row → text: arrow labels, role tags, the seal's exit words, **reference**, **never the code**, **v1 / v11 / every version kept** → legend, rule panel, showcase strip, caption.

Arrows end at edges, so no panel covers a head. Text never touches a stroke: each lane label sits in a measured gap of its own line, the exit words beside their drops, **user** above the eye, **never the code** under the struck sheet.

## Replay units and stages

Each unit carries every choice it needs at build time — rects, colours, alphas, weights, dash pattern, the routed path, the stroke outline, label string, face, size.

1. **Regions and headings** — frame; title strip; the three bands with their numbered 楷 titles and sans English.
2. **Labelled panels** — the ten panels (fill, eave and wash, outline, family rule, title, subtitle); the reference glyph's paper; the seal; the eye's opaque fill.
3. **Connections** — A1–A8, then A9 with accept and revert, A12, A13, A14; each grown along its length, heads laid last.
4. **Illustrations** — the ink-line icons and actor glyphs, and the eleven-square version row.
5. **Connector labels** — the two lane labels, the three role tags, the seal's three exit words, **reference**, **never the code**, **v1 / v11 / every version kept**.
6. **Legend, rule and showcase** — legend; rule panel; showcase strip; caption.

Pacing by visible work: bands in a moment; panels left to right, the seal after 盲评; arrows along their length; icons one by one; text run by run; the bottom row legend → rule panel → strip → caption. Deep links `#p=0…1` and `#stage=1…6`; `#svg` renders the same units into an inline `<svg>`. Text stays text in the SVG; every stroke is one filled path.

## Rules every unit obeys

- **The blank list**: the gutter except the executor and the legend; band 1 between 规格 and the reference glyph; band 2's top strip except A12's run; the span between the seal and the wiki except the eye and its tag; the margins. Band 3's right half is no longer blank — it carries the version row.
- **Word budget 70**, held exactly, no reserve; no label off the list, no list word missing.
- **Four sizes** (52 / 36 / 28 / 22) plus the seal's 84; two faces plus the seal face; 楷 for headings and the CJK lines, sans for English.
- **Arrows attach at panel edges**, never inside; labels beside or in a gap of the path, never across it.
- **Widths follow content**; heights follow the icon per band.
- **One colour per role** — no band hues, no coloured panels.
- **Icons are ink line work** at 2.0 px primary and 1.4 px 淡墨 at α 0.6, every line a brush stroke; no fills but paper, no raster, no glyph from an icon set.
- **The framed 绢 window is one function** used wherever a rendered picture is meant; the scene inside it belongs to its side — the three-peak mountain on the source side (风格源, reference), the arched bridge with boats on the work side (渲染, the magnifier, the replayable page, the version frames, the 卷宗 scroll), where the reader can find it again in the showcase strip.
- **One raster**: `showcase.jpg`, scaled uniformly, clipped to its rectangle.
- **No randomness at draw time**; seed 7 at build.
- **Fills, strokes, text, images only** — no blend modes, no filters, no gradients.

## Assets

| file | size | placed | source |
|---|---|---|---|
| `src/thumbs/showcase.jpg` | 3040 × 321, JPEG q85 | 1520 × 146 at (240, 794) | `~/Desktop/qingming-wuhan/iterations/v11/full.png` (5300 × 560), whole, resized |

The v1–v2 crops still in `src/thumbs/` are not embedded and can be deleted. Libraries are local — `src/p5.min.js` (p5 1.9.4), `src/p5.svg.js` (p5.js-svg 1.5.1) — so the page works offline and under `file://`.

## Views for the blind gate

- **The reading view**: the whole figure at 1×, 1800 × 1000 (`#p=1`), read at 900 CSS px. The explanation comes from this one, before any enlargement.
- `review/v6-band2-2x.png` — band 2 at 2× (3600 × 652): the panels, the seal and its three exits, the eye, the store, the four line kinds and their labels.
- `review/v6-bottom-2x.png` — the bottom at 2× (3600 × 846, y 577–1000): band 3 with the version row, the rule panel, the strip and the caption. Recut whenever band 3 or the rule panel moves.
- The **process sheet** (`#stage=1…6`, six panels tiled 3 × 2, labelled regions and headings → labelled panels → connections → illustrations → connector labels → legend, rule and showcase) goes only when stage order or unit behaviour changes. The reviewer's repeated naming objection was upheld: these names replace the old short ones.
- The SVG beside the PNG once per round, for breakage only: a stroke at the wrong width, a label in the wrong face, the strip missing, a dash pattern lost.

## Render settings

Edge headless at `--window-size=1800,1000`, `--virtual-time-budget` from the observed build and font-load time (4000 ms is enough on this machine), `file://` since the page is self-contained. Check each render for fallback glyphs in 判 · 卷宗 · 程序即画 · the caption, and that Optima resolves.
