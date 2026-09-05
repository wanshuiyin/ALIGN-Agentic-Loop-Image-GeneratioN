# Reference — the style source, its craft, and what we take

**CRAFT_CLAIM** (rewritten 2026-09-05 after the user's look at v2, **D-14**): a method overview drawn by ALIGN's authors for the README, in the *composition* of ARIS-Movie-Director's Figure 1 and in the *visual identity* of ALIGN's own scrolls — a title top left; three numbered stage bands read top to bottom, each a left-to-right row of panels with a 楷 title and a one-line sans subtitle; every panel an ink-outlined paper panel carrying an ink-line icon (白描), none a screenshot; four arrow kinds told apart by meaning and drawn as brush lines (heavy ink main flow, 赭石 repaint loop, 花青 dashed overrule, thin 淡墨 audit trace); the gate a double-ruled panel, the verdict a 朱砂 seal; the ground the scroll's silk lightened to a page tone; a legend of the four line kinds bottom-left, the stop rule on a panel beside band 3, and exactly one raster — the whole 武汉 scroll as a showcase strip along the bottom with a one-line caption. Mode: **风格迁移** — 取其法,不取其景: the source's composition, grammar and hierarchy; the project's own ink and silk. Nothing in the loop judges resemblance to the source's content, and from round 3 nothing judges the departure from its palette, white boxes or thumbnails (D-14).

The first claim, held through rounds 1–2, read "… boxes with a bold title, a grey one-line subtitle and one real thumbnail … a shield on the gate, a diamond for the verdict; a bottom row of legend, rule box with a two-example contrast, and a release strip of four captioned panels." The user ruled it too many screenshots and too ugly a pipeline; it is not built on.

## What is taken from the source, and what is the work's own (D-14)

| | from the style source | the work's own (from `qingming-wuhan/src/core.js` and the scrolls) |
|---|---|---|
| composition | title top left; three numbered bands top to bottom, panels left to right; loops under and between; legend bottom-left | the bottom row becomes one showcase strip; the rule panel moves up beside band 3 |
| grammar | one panel family per meaning (step / gate / store / verdict); four arrow kinds by meaning; labels at the arrow; widths follow content; heights differ by band | panel = ink outline + paper + eave; gate = double rule; store = ledger rule; verdict = seal |
| hierarchy | band titles first, main flow second, the rule and the bottom third; ≤ 70 words; three sizes plus the title's | 楷 for headings, humanist sans for English supports; 36 / 28 / 22 |
| marks | — | brush lines with 起笔 and 收笔 (`bline` / `brushDraw`'s profile), chevron heads, the seal (`sealStamp`'s idea), 白描 icons |
| colour | — | silk page #d9cbb0, band #cdbc9c, paper #ece2cc, ink #2b2620, 赭石 #a8703e, 花青 #4a6a86, 朱砂 #b0392a, 石绿 #5f9a6e |
| pictures | a thumbnail per box (its content — not taken) | none in the panels; one raster strip of the method's own output at the bottom |

## The image, fixed

- **Source**: `reference/aris-movie-director-figure1.jpg` — a 2× screenshot of the README of github.com/wanshuiyin/ARIS-Movie-Director as rendered on 2026-09-05, the figure shown at the README column's width. The figure proper sits inside a 1 px grey hairline frame at (53, 220)–(1728, 1336) of the screenshot: **1675 × 1116 px, aspect 3:2**. Everything above the frame is README prose, not the figure.
- **Displayed width**: GitHub's README column, ≈ 840–900 CSS px; the screenshot is 2× DPR, so 1675 px ≈ 840 CSS px. That column is the **reading size**. The screenshot at 1675 wide is what the reviewer sees and what we measure; enlargements diagnose the box grammar and arrow heads and set no finish standard.
- **Crop**: the whole figure inside its frame; no partial crop.
- **Version**: the README as of the movie-director run with 19 scenes / 24 frames (`reference/movie-director-README.md`); the figure's own caption reads "Figure 1 — from story intent to a verified movie, end-to-end". No other version exists to confuse it with.
- **Aspect we use**: **1800 × 1000** (the user fixed it; canvas and SVG viewBox). The source at 1800 wide would be 1200 tall, so our vertical rhythm is the source's proportions compressed by a sixth: title strip ≈ 7 %, band 1 ≈ 19 %, band 2 ≈ 30 %, band 3 ≈ 18 %, bottom row ≈ 16 %, the rest gaps and margins. Bands, the loop crossing and the bottom-row split are kept; nothing is merged.
- **STYLE_WINDOWS** (cut once, shown to the reviewer from round 2 on, never in round 1):
  - `reference/style-windows/whole.png` — the figure inside its frame, resized to 1800 × 1200 (the canvas width; the reviewer's screen).
  - `reference/style-windows/band2-dense.png` — band 2 at 2× (2980 × 680): the densest band, five boxes, a diamond, three loop kinds.
  - `reference/style-windows/legend-rule.png` — legend + rule box at 2× (1610 × 454).
  - `reference/style-windows/box-asset-library.png` — one step box with its thumbnail row at 2× (740 × 344).
  - `reference/style-windows/title-strip.png` — title + italic subtitle at 2× (1280 × 200).
  - From round 3 (D-14) the windows are shown for **composition, grammar and hierarchy only**; the prompt says so in one line beside the scope block. The work's palette, panel construction, brush arrows, seal and icons are the user's decision and are judged on execution, not on distance from these windows.

## Scale and the three sizes

At the README column (≈ 900 CSS px ≈ 238 mm at 96 dpi) the 1800 px canvas gives **≈ 7.6 px / mm**; on a printed double column (170 mm) it would be 10.6 px / mm, and 16 px type would be 1.5 mm — a README figure, not a paper figure. Measured glyph extents in the screenshot, scaled ×1.075 to 1800 wide:

| role | source (px at 1800) | ours |
|---|---|---|
| figure title (README strip) | ≈ 58 bold | **52 bold** sans (ALIGN) · 楷 36 (程序即画) |
| italic subtitle under it | ≈ 26 italic | **22 italic** sans, on the same line |
| band title | ≈ 32 bold, band hue | **36** 楷, ink · sans 22 English beside it |
| box title | ≈ 27 bold | **28** 楷 (sans bold 28 for the rule sentence) |
| subtitle · arrow label · legend · caption | 16–18 regular | **22** sans; 楷 22 for the CJK lines |

Rounds 1–2 ran at 30 / 22 / 16 then 32 / 26 / 18 (D-04). From round 3 (D-14): **36 / 28 / 22**, plus the title's 52; **nothing smaller than 22**. The reviewer asked for a 22–24 floor twice; it was held off while headings and supports shared one Latin face, because 26 over 22 collapsed to two sizes. With 楷 CJK headings over sans Latin supports the levels are separated by script and face as well as size, and panels no longer hold thumbnails, so the floor rises without the collapse. At reading size 22 px ≈ 11 CSS px — legible without click-to-enlarge. **Not individually resolved at reading size**, treated as texture: the tick marks and ruled lines inside the icons (the booklet's table, the colophon columns, the code sheet's lines) and everything inside the showcase strip.

## Word budget

Counted in the source: title strip 8 · band 1 25 · band 2 35 · band 3 19 · legend 12 · rule box 26 (its speech bubbles counted; they are read) · release strip 16 — **≈ 140 words, three sizes plus the title's**. Boxes carry one title and one line of 3–5 words; the main flow is unlabelled; each loop carries condition + limit ("RETRY · max 4/panel", "repair drift · max 6/run"). Ours is capped at **70 English words** (the user's number; the skill's "about seventy"); from D-14 the 楷 headings are a second list — exactly one per band, panel and bottom region — plus 取其法,不取其景, the caption 清明上河图·武汉,11 版 11 轮盲评,3.5 → 7.0 and the 千里 line 千里江山图 · 意临 · 12 版 11 轮. `plan.md` holds both lists (63 English tokens at the rewrite) and every label is held to them.

## Order of work (the six stages the page replays)

Visible in the source: the title strip and the band regions plainly went down first (boxes sit inside tints, never over their edges); the legend, rule box and release strip are the same width family as nothing above and were added last; arrows end at box edges, so boxes preceded arrows. Where the source does not show an order, the conventional build order is used and this is its one statement:

1. **色带** — hairline frame, title strip (title + italic subtitle), the three tinted band regions with their outlines and numbered titles.
2. **框** — every box in the bands: title, subtitle, a reserved thumbnail rectangle; the diamond; the store; the shield badges.
3. **箭头** — main flow first (left to right, in reading order), then the loops: repaint, overrule, audit — each its own weight and colour, routed edge to edge.
4. **白描** (was 缩略图 in rounds 1–2) — the ink-line icons drawn into every panel and the two actor glyphs; since D-14 nothing raster is placed here. Named for what it lays down.
5. **文字** — labels on arrows, glyph labels, tags, the outcomes line.
6. **图例** — legend, the rule panel with its two text lines and drawn ✗ / ✓, the showcase strip with its caption (the bottom row, as the source's was added last).

A stage adds only what it names. The seal is laid in 框 — it is the verdict's shape, as the diamond was.

## Box grammar

- **Stage band**: a tinted rounded region (radius ≈ 14 at 1800) with a 1.5 px outline a little darker than its tint; a numbered title "N · Name" at the band-title size, bold, in the band's own hue, top-left inside the band; boxes in one row inside it. Band heights differ: the source's middle band is 330 px against 230 and 170 (screenshot px) because its boxes carry the largest thumbnails. **Bands all one height is the first template tell.**
- **Step box**: white fill, one corner radius (≈ 12 at 1800), a 1.5 px stroke in the band's hue (blue-grey #556886, green #44643e, violet #766c9c); title centred, bold, box-title size; subtitle centred under it, grey, smallest size, one line; the thumbnail centred under that, its aspect the crop's own, never more than about a fifth of the box's area; the thumbnail row may end in "…" when it stands for many. **Width follows content**: `Outline` (212 px) is 60 % of `Asset Library` (346 px) because it holds one line and one icon. A box never holds a paragraph, a second thumbnail, or a title the caption already carries.
- **Gate**: a step box with a **shield badge** at its top-right corner in the band's dark hue (`panel_gate`, `page_assembly_gate`). The verdict is a separate **diamond** with the verdict word bold inside and its outcomes under it ("KEEP / RETRY"); its stroke is the band's dark green; its exit arrow carries the outcome word in green.
- **Store**: `research-wiki` — a step box whose "thumbnail" is a drawn open book; title, subtitle listing what is logged ("attempts · reviews · decisions · failures"). The reader knows it is a store by the book, not by the box.
- **Release**: the last box of band 3, `Release`, same grammar as a step, its thumbnails the actual output (PNG panels, the viewer).
- **Actor**: the mascot outside band 1 at the left, handing the brief in; an arrow from the actor into the first box crosses the band outline. The reviewers appear inside the gate box as its picture.

**Ours, from D-14** — the same families, in the scroll's construction: a **panel** is paper (#ece2cc) inside an ink `rule` outline with square corners, a heavier eave-like top rule overhanging 8 px each side and a soft 淡墨 wash under it (three translucent rules, no gradient); 楷 title, sans subtitle, an ink-line icon below, never a paragraph, never a raster. **Step** = the panel. **Gate** = a double-ruled panel (a second rule 4 px inside) — the shield is not taken. **Store** = a ledger rule 10 px under the eave, and the hand-scroll icon. **Verdict** = a 朱砂 seal, square, 白文 「判」, its outcomes on one sans line beneath. **Actor** = a drawn glyph without a panel: the executor (a brush over a keyboard) in the gutter, the eye on the flow, the reference (a framed 绢 window) at band 1's right. The **rule panel** is a step panel outside the bands. Bands keep the source's grammar (a numbered title top-left, one row of panels, heights that differ) but take one silk tint and a 淡墨 outline.

## Arrow grammar, by meaning (four kinds, and no fifth)

| kind | meaning | weight | colour | dash | head | attaches | label |
|---|---|---|---|---|---|---|---|
| main flow | the step order inside a band | ≈ 5 px | ink #162039 | none | filled triangle, ≈ 18 px | box edge to box edge, horizontal | none — except the verdict's outcome word ("KEEP", green) on the diamond's exit |
| retry loop | back to an earlier box in the same band | ≈ 3 px | orange #d67227 | none | filled, smaller | leaves the diamond's lower-left edge, runs **under the boxes inside the band**, re-enters the bake box from below | condition + limit, centred **in a gap of the line** at mid-path, in the arrow's colour, bold italic |
| repair loop | back to an earlier band | ≈ 3 px | blue #3762af | dashed ≈ 10/8 | filled | leaves a band-3 gate's left edge, runs left, **crosses the band gap vertically between two boxes**, re-enters the band-2 box from below | condition + limit beside the vertical run, in the arrow's colour |
| audit trace | what gets logged | ≈ 1.5 px | grey #727679 | none | small open/filled, ≈ 8 px | leaves the gate's top edge, runs along the top of the band, drops into the store's top edge | "write audit trace", grey italic, above the horizontal run |

Between bands there is **no main-flow arrow**: the numbers carry the sequence; only loops cross band gaps, and they cross in the gap between boxes, never through a box or a title. Heads never sit inside a box. Labels sit beside the path or in a gap of it, never across it.

**Ours, from D-14** — the four kinds and the same meanings, drawn as brush lines (a port of `core.js` `bline` / `brushDraw`: a swell at the head, a taper at the tail, ±10 % ink load along the body, butt-capped pieces): main flow **ink 5 px**, head 18; repaint **赭石 3 px**, head 12, labelled in a gap of its line; overrule **花青 3 px dashed 10/8**, head 12, labelled beside its descent; audit **淡墨 1.5 px** (`rule` style, no swell), head 8, unlabelled. Heads are two-stroke chevrons (撇捺), one shape scaled by weight. The overrule crosses the 1/2 gap, not the source's 2/3, because what overrules the reviewer is the reference fixed in band 1.

## Palette by role (measured at reading size)

| role | hex |
|---|---|
| ground | #fdfdfc (white on the README page); hairline frame #8a8a8a 1 px |
| band 1 tint / outline / title | #eef5fc / #b9c8dd / #213d6a |
| band 2 tint / outline / title | #f3f8f1 / #8fb096 / #224d1d |
| band 3 tint / outline / title | #f5f2f9 / #a7a3c5 / #362e5c |
| box fill / title ink / subtitle grey | #ffffff / #080d19 / #3a3c43 |
| box stroke by band | #556886 / #44643e / #766c9c |
| main flow ink | #162039 |
| retry orange | #d67227 |
| repair blue | #3762af |
| audit grey | #727679 |
| pass green / fail red | #346636 / #922625 |
| shield (band 2 / band 3) | #316850 / #504484 |
| legend box outline / fill | #9cb4c7 / #f7f8fa |
| rule box fill / outline / title | #f7f2f2 / #9e7984 / #4b0e0c |
| release strip fill / outline / title | #faf9f5 / #ddcfba / #3c2409 |

Band tints sit at 95–97 % luminance and read as regions only against the white gaps. White: the ground between bands, the inside of every box, the margins. No gradient, no shadow, no glow anywhere in the source; the only "decoration" is the three shield badges, which are grammar.

**Ours, from D-14** — the source's palette is not taken; the roles are kept and filled from the scroll (`C.silk` [151,129,95] lightened for the page; the scroll's 赭石 / 花青 / 朱砂 / 石绿 as the loop and mark colours):

| role | hex |
|---|---|
| page ground | #d9cbb0 |
| the three bands (one tint) | #cdbc9c |
| paper — every panel's fill | #ece2cc |
| ink — flow, outlines, titles, icons | #2b2620 |
| 淡墨 — audit, secondary lines, band outline, eave wash, the struck-out X | ink at α 0.45 (wash 0.14 / 0.08 / 0.04) |
| 赭石 — repaint | #a8703e |
| 花青 — overrule, the word reference | #4a6a86 |
| 朱砂 — the seal, the ✗ | #b0392a |
| 石绿 — the ✓ | #5f9a6e |
| 白文 in the seal | #efe6d0 |

What stays "white" in ours is paper: the inside of every panel outside its icon and text. The page and the bands are silk; the gaps between bands are page. The eave wash is the one place ink sits translucent under a rule and is the panel's construction, not a drop shadow.

## What the eye reads first

1. The three numbered band titles and the ink main flow running through each band — the figure's skeleton in one glance.
2. The orange retry loop with its label, the diamond, and the title strip.
3. The bottom row — the rule box's title "looks right ≠ passes" and the row of released panels — then the legend.
The mascot and the generated scenes are seen but not read first; the type hierarchy holds them down.

## What makes a figure look template-made — and how the source avoids each

- Every box the same size — **avoided**: widths follow content (`Outline` ≈ 0.6 × `Asset Library`), heights follow the thumbnail.
- Every arrow the same weight — **avoided**: 5 / 3 / 3-dashed / 1.5, each a meaning.
- A legend that explains what the eye already understood — **partly avoided**: the legend lists only the four arrow kinds; nothing else gets a legend line.
- Icons from a set — **avoided in the figure's grammar** (the shields are one drawn shape); **not avoided** in its content (the mascot, the stock-looking document icons) — content, not taken.
- A colour per box with no role — **avoided**: colour belongs to bands and arrow kinds only; every box is white.
- Text centred in every box — **present** (titles and subtitles centred), and it reads as designed because widths vary; band titles are left-set.
- A title inside the figure that the caption carries — **present and right**: a README hero carries its own title.
- Shadows, gradients, glow — **absent**.
- Clip-art thumbnails where the method's real output would say more — **the source's real weakness**: its thumbnails are generated scenes, which is its content. Ours are crops of the method's own program-rendered scrolls.
Also: bands all one height — avoided (230 / 330 / 170).

How ours avoids each from D-14: widths follow the subtitle and heights the icon per band (176 / 240 / 280 in one row); four brush weights; the legend lists only the four line kinds; **icons are drawn for their panel in one line grammar, not taken from a set** — the same framed 绢 window is drawn wherever a rendered picture is meant, and that repetition is the method; colour belongs to ground, paper, ink and the four roles, no panel is coloured; titles are centred in panels of differing width, band titles left-set; the README hero carries its title; the eave wash is a construction, not a drop shadow, and there is no gradient; the one picture is the method's real output. The new tells to watch for in an ink idiom: a brush stroke that reads as a wobbly vector line (the head and tail must show); a seal that reads as a red square with a letter in it (the nibbles, the uneven paste and the even 白文 bars must show); icons that read as clip art at reading size (1.6 px primary lines, one motif each, no fills).

## What the source leaves alone (cheapest wins; keep them)

- No box for the input: an actor and one arrow.
- No label on the main flow.
- Band 3 has two boxes because two is what happened; its left half is empty except for the dashed loop's landing.
- Margins nobody filled: the strip of ground left of band 2 and 3, the gap between the diamond and the store.
- One line weight per arrow kind, one radius, one face.

## Illustrations

The mascot, the cartoon reviewers, the baked scenes and the story panels are the source's content, and they were image-generated: not taken, not imitated. From D-14 **no panel holds a raster**: every panel carries an ink-line icon the program draws (a brush over a keyboard; framed 绢 windows with a mountain sketch; a ruler and divider; stitched booklets; four module motifs; a code sheet; a figure with a magnifier and a struck-out code sheet; a hand-scroll with a colophon column; an unrolling scroll with a scrubber; three frames of growing detail). The **one raster** on the page is the showcase strip: the whole 武汉 scroll v11, program-rendered, resized (`src/thumbs/showcase.jpg`), with its caption and a text-only 千里 line. Nothing is generated by an image model — no diffusion, no image tool of any kind — and nothing is drawn to look like one; the silk ground is a flat colour, not the scroll's baked grain.

**The contrast our rule box may state in one line**: the source's figure was baked by an image model from a blueprint and then verified by transcription scripts (`movie-director-README.md` 225–300); ours is a program whose every mark is the specification, judged blind.

## Text and title

The figure lives in the README at the top of the page, under the H1. It carries a title strip like the source — **ALIGN** in the sans, 「程序即画」 in 楷, *the program is the painting* in italic, on one line; a paper version would drop the strip and let the caption carry it (the 千里 run's D-02 is the same decision).

## Composition

Three bands, top to bottom, each read left to right; boxes ≈ 45 % of the band area, the rest tint and gaps; loops: retry inside band 2 under the boxes, repair crossing the 2/3 gap between boxes, audit along the top of band 2 into the store; bottom row split legend (14 %) / rule box (32 %) / release (50 %) — legend at the left because it is read last, the release strip at the right because it is the end. For our transfer: the rhythm from the source (180 / 290 / 164 at 1000 tall); the panels from the method; our overrule loop crosses the **1/2** gap instead of the 2/3 gap because the thing that overrules the reviewer (the fixed reference) was fixed in band 1. From D-14 the **bottom row** is the legend (bottom-left, unboxed, in the gutter column under the executor) and one showcase strip 1520 × 161 across the bands' width with its caption; the **rule panel** moves up beside band 3, in the half of that row the source leaves empty. Both breaks are recorded in `plan.md`.

## Borrowed

From `/Users/rfy_naiveai/Desktop/qingming-wuhan/src/core.js` (D-14), ideas only, no file taken: the **brush profile** of `bline` / `brushDraw` — a stroke resampled through a spline and cut into butt-capped pieces whose width follows a three-part profile (head, body with ±ink-load noise, tail), every choice made at build; the **seal** of `sealStamp` — a 朱砂 field with rim nibbles where the silk shows through, uneven paste on one pressure axis, and 白文 as even bars — reduced to fills and text so the SVG carries it; the **palette by pigment name** (`C.silk`, `ochre`, `huaqing`, `zhusha`, `shilv`) as the roles' colours. Not taken: the silk baker (a raster ground), `dabs` / `wash` (radial gradients the SVG would not carry), the seal's 8× raster. From the 千里 run's page: the idea of `#p=` / `#seq=` deep links for headless renders and the determinism gate.
