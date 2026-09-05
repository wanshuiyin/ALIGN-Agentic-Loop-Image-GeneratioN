# core.js · head.html · tail.js · harness.html

Files: `src/core.js`, `src/head.html`, `src/tail.js`, `src/harness.html` (+ `src/mod-sample.js`, `src/scene-sample.js`, the harness's proof scene). Contract reference: `wiki/interfaces.md` §3–§4. Everything below is as implemented; deviations from interfaces.md are marked **≠**.

## Globals (core.js)

`SW=5220 SH=500 CW=220 PW=5000 VW=930 VH=500 MMH=round(VW/SW·SH)=48 GAP=12 CH=560 Y_FAR=140 Y_NEAR=480 OBL=[-0.45,-0.55]`
`C` — silk, silkDk, paper, ink, ochre, ochre2, huaqing, huaqing2, danmo, zhusha, tenghuang, tree, trunk, red, **zhilv, shilv**. **D-19(2)**: `silk=[151,129,95]` (was [160,140,106] — 5–8 % darker and warmer toward 赭黄褐; the harness measures the empty ground at 149.9/128.0/94.2), `silkDk=[110,86,56]`, `paper=[190,170,132]` (still paler than the silk). **D-19(3)**: `zhilv=[118,138,88]` 汁绿 — a thin transparent wash over an ochre base for a few 树冠内侧 and 近坡; `shilv=[96,150,110]` 石绿 — opaque mineral green, local 轻提 only, never a whole slope; `huaqing` unchanged.
`STAGES` — 10 × `[name, sub, paragraph]`; `ST` — `{SILK,DRAFT,JIEHUA,BOATS,TREES,FIGURES,WATER,OCHRE,INDIGO,FINISH}`.
`COLOPHON`, `SIGN_TEXTS` (16 boards — v10 added 「黃鶴樓」「武漢關」), `SEAL_TEXTS=['取法','不取景','珍藏','審定']`, `TITLE_TEXT='清明上河圖 · 武漢'`, `ALL_TEXT` = colophon + signs + title + seals. **≠** interfaces §4 says the integrator writes `ALL_TEXT`; it lives in core because tail.js's font gate needs it. Any *new* string a module rasterises must be appended to `ALL_TEXT` (or to `SIGN_TEXTS`) in core.js.

## `makeCtx(p, opts)` → ctx

**≠** takes an optional `opts={SW,CW}` so the harness can build a 1200-wide, paper-less ctx. Consequently **modules must read `ctx.SW` / `ctx.CW` / `ctx.PW`, never the globals**. `p.noiseSeed(7)` is called inside makeCtx; main.js need not repeat it.

| field | as implemented |
|---|---|
| `SW SH CW PW Y_FAR Y_NEAR OBL ST C` | `SW/CW/PW` reflect `opts` |
| `depth(y)` | `0.75+0.25·clamp((y−Y_FAR)/(Y_NEAR−Y_FAR))` |
| `R rr ri clamp smoothstep col` | mulberry32 seed 20260404; `ri` inclusive both ends |
| `noise(x,y,z)` | `p.noise` |
| `S`, `add(st,x,f)` | `S[st].push({x,f})` |
| `line(st,x,c,al,w,x1,y1,x2,y2)` | ROUND cap, gen3 |
| `pline(st,x,c,al,w,pts,curve,style)` | gen3; drops < 2 pts; `curve` → curveVertex with doubled ends. **≠ D-06**: when `w ≤ 0.6` and the polyline is longer than 12 px it is a brush mark and goes through `brushDraw` (below) — `curve` then means Catmull-Rom samples at ~2 px. **D-10(c)**: with `style` (optional 8th arg, one of `ctx.INK.style`) the polyline always takes the brush path with that material profile, whatever `w` or length. |
| `rline(st,x,c,al,w,x1,y1,x2,y2,z,over)` | straight, constant width end to end, no jitter; butt caps, `over` default `rr(0.5,1.5)` + w/2 extends both **true** ends; alpha ×`rr(0.92,1.08)` per line. **D-08**: the 1.2-px end dwell is gone — two dwells meeting at a corner were the reviewer's "dark bead at the junction". The ink load still drifts along the rule — pieces of 6–10 px take alpha ×(1 ± 0.15) from one slow noise, merged while equal; a rule longer than 60 px at `al ≤ 170` loses contact once with probability 0.3 (was 0.55) for 0.8–1.4 px. Callers' alpha is not darkened. With `z`: sampled every 2 px against `masks.hidden`, drawn as the visible runs; a run cut by an occluder gets no overshoot at the cut. |
| `bline(st,x,c,al,w,pts,z,style)` | sparse input (mean vertex spacing > 3 px) is resampled through a Catmull-Rom spline at ~2 px so a 4-point 衣纹 reads as one brush line; dense input is used as given. Jitter ±0.18 px on resampled points, ±0.3 on given ones. Then `brushDraw` (**D-08**, rewritten — D-06's endings read as beads and chips): `w` is clamped to 0.9 and the body is exactly `w`; 起笔 is a smooth swell (smoothstep) from 0.8 w to w over the first 8 % of the arc length; 收笔 a smooth thinning to 0.85 w over the last 10 %; nothing else at the ends — no 回锋 hook, no dry lift, no dwell, no alpha drop. 提按 along the body: width and alpha ×(1 ± 0.12) from one slow noise (`noise(ph+s·0.035)`). Texture grade (`al ≤ 100`) gets **no head at all**, only the thinning, and on marks ≥ 18 px loses contact round(L/30·rr(1,2)) times for 1–2 px, never within 4 px of either end. Marks < 6 px are one plain piece at 0.9 w. Width is quantised to 0.06 px and alpha to 10 into butt-capped pieces that abut without doubled caps. With `z`, hidden samples are dropped and the visible runs drawn. **D-10(c) `style`** (optional 8th arg, one of `ctx.INK.style`): `garment` — the profile above (default, unchanged); `branch` — width falls from w at the **first** point (draw base → tip) to ~0.45 w at the last, no swell, no thinning tail, the stroke simply ends; `rock` — no head, no tail, constant width, contact broken along the way at every grade (皴, 折带); `rule` — constant width, no head, no tail, no gaps, no jitter (a freehand line that behaves like `rline` along a polyline). |
| `chunks(st,pts,c,al,sw,len)` | gen3: 70–190 px pieces sharing one point, PROJECT cap, constant alpha |
| `dabs(st,reg,c,ink,step,rad,pred,opts)` | gen3 `dabsIf` body and alpha formula unchanged (`OVER=π·rad²/step²`, `a=1−(1−ink)^(1/OVER)`, per-dab `a·rr(.75,1.25)·(.8+.5·noise)`, gradient stops 0 / 0.6 ×0.85 / 1, ≤ 8 dabs per stroke). `reg={x0,x1,y0,y1,z,inside(x,y),edge?(x,y),tone?}`; cells with `!inside`, `masks.hidden(x,y,reg.z)` or `pred(x,y)===false` are skipped. Radius is capped at `max(1.2, edge·0.9+0.5)` so colour stays inside the outline; when `reg.edge` is absent the edge is estimated by probing `inside` at 0.35/0.7/1 × rad. `opts.pool` = no noise holes, alpha ×`rr(0.9,1.1)` (积水); `opts.angle(x,y)` → elliptical dabs (1.7 × 0.75 rad) at that angle. |
| `wash(st,poly,c,ink,step,rad,z)` | `dabs` over the polygon with an exact edge distance |
| `brush` | `makeBrushText(R)` → `{brushText, stampDabs}` |
| `sealStamp(st,x,y,sz,text)` | **D-10 tell 7** — the 白文 is carved before the paste touches it. At build the text is rasterised at 8× in an even-weight face (`"Heiti SC","PingFang SC","Songti SC","Noto Serif SC","Kaiti SC"`, weight 600), thresholded, and closed with a 3×3 square (dilate 1, erode 1) so every corner and stroke end is square; the raster is trimmed to its content so each character fills its cell (滿白文). Cells: a red margin of 0.09 sz stays between the 文 and the rim, a 0.05 sz gutter between cells; 2 characters stack in one column (each wider than tall), 3–4 sit in a 2×2 read top-right, bottom-right, top-left, bottom-left (3: the left column's single character centred). The white bars are drawn as that raster scaled down (smoothed) — clean edges, no font hinting at 16 px. Only then the 印泥: the red creeps 0.5–1 px (×sz/16) into the white bars at 4–6 points sampled on the bar edges; the paste runs 0.95 → 0.58 along one pressure axis with 3–4 soft firmer zones; the rim has exactly 2 nibbles (r 0.06–0.11 sz) and 3 small edge chips, all holes in an even-odd clip — the silk shows through, nothing silk-coloured is painted. The D-08 dashed white re-strokes and clogged-corner dots are gone (they were the 「糊块」). Rasterising uses `document.createElement('canvas')` at build, as `makeBrushText` already does; the glyph canvas lives in the stroke closure. |
| `masks.stampZ(fp)` | writes `round(fp.z)` (clamped 1…65535) where `fp.inside(x,y)` and z > existing, over the integer bbox `x0..x1, y0..y1` |
| `masks.hidden(x,y,z)` | `x<CW` → true; off-canvas → false; else `Z > z+1` |
| `masks.solidAt(x,y)` | `Z > 0` |
| `masks.stampWater(poly)` / `waterAt(x,y)` | scanline even-odd fill of a Uint8 raster |
| `masks.clearAround(fn,x,y,r)` | 5-point probe, gen3 |
| `polyInside(poly)→fn(x,y)`, `polyEdge(poly)→fn(x,y)` | **≠ added** helpers for footprints (even-odd test; distance to the nearest edge) |
| `reg` | `{buildings,boats,trees,figures,zones,slots}` — empty arrays; every `build()` pushes its `{fp,slots}` |
| `silkWear` | **D-19(5)** `[{x,w,a}]`, filled by `bakeSilk` — one entry per 折痕 line (a doubled crease is two entries): `x` its centre, `w` its width (0.6–1 px), `a` its darkest alpha (14–40, or 0.6× that for the doubled line). main.js's FINISH pass lifts ink and colour along them (「折损偶尔同时磨断墨与色」); core only exposes the data. Empty before `bakeSilk` runs. |

Line grades are a hierarchy (D-06) and are exported as `ctx.INK = {primary:[0.65,205], structural:[0.5,150], texture:[0.35,90], style:{garment,branch,rock,rule}}` = `[w, alpha]` plus the **D-10(c) material styles** (`ctx.INK.style.branch` etc. are the strings `'branch'` …; pass one as the last arg of `bline`/`pline` — figures pass nothing or `garment`, tree branches `branch`, 皴 and rock outlines `rock`, freehand-but-straight members `rule`) (**D-08**: ~25 % thinner than D-06's 0.8/0.6/0.42) — primary silhouette dark, structural division mid, texture pale and broken. `bline`/`pline` clamp `w` to 0.9, so a module passing w > 0.9 gets 0.9. Ruled architecture stays a grade paler than freehand figures: give `rline` structural/texture for most members and primary only for the eave and silhouette lines. `bline`/thin `pline` at `al ≤ 100` are texture marks: no head, a gentle thinning at the end, broken contact away from the ends — use them for 皴, twigs, weave and water; `line` and `chunks` are unchanged (plain segments). A stroke starting on another stroke (a 衣纹 leaving the shoulder line) now meets it without a bead: the head is a swell of the same ink, not a darker knob.

## `bakeSilk(p, ctx)` → p5.Graphics, `revealSilk(ctx, silkImg)`

Silk `C.silk`, paper rect for `x<ctx.CW` (+1 px boundary line), grain ±3 per pixel, warp every 1.3 px alpha 6, weft every 1.6 px alpha 3, 12 000 fibres (count scales with canvas area). **D-16 (B8 tell 6)**: no stains, nothing baked in varies slower than a fibre. **D-19(2)+(5)** the aging, and nothing else — all of it drawn from the silk's own generator (`rn`, seed 99, the one the grain already used) so `ctx.R` is consumed exactly as in v9 and every module keeps its dice:

- **edge band** — only within the outer 3–6 px of the **top and bottom** edges: per column the depth is 0–6 px from a slow noise plus a fine ragged noise (some columns get almost nothing), the strength 0.3–0.5 toward `silkDk` at the very edge, falling with `(1−e/depth)^1.2` — a torn band, not a frame; the left and right ends and the corners get nothing, no vignette, no radial anything. Measured: edge row ≈134, back to ground by 4–5 px.
- **经向丝缕** — warp bundles at irregular 4–16 px spacing, 0.28–0.35 px wide, alpha 8–22 (a third of them a shade *paler* than the ground), in broken runs of 30–170 px — finer and paler than the texture grade (0.35 / 90).
- **折痕** — `max(2, round(4–7 · SW/5220))` vertical creases at irregular x (one per equal band, placed at 15–85 % of it), 0.6–1 px wide, the fold's ink 14–40 varying along the height in 12–40 px runs (one noise), the line wandering ±0.6 px; half of them double 2–3 px beside for 30–70 % of the height at 0.6× the ink; 45 % carry 1–2 px of pale wear on one side (`silk+30`, alpha 20–40) where the silk lost its colour. Each line goes into `ctx.silkWear`.
- **断纹** — 20–40 per scroll (scaled by area), 2–8 px, hairline 0.3 px, kinked once, three quarters within ±17° of the warp, the rest at any angle; 淡墨 (`silkDk` alpha 35–70) or pale (alpha 40–70).

`revealSilk` adds the stage-0 50-px column strokes. Both consume `ctx.R`, so call order is fixed: `bakeSilk → revealSilk → build` (tail.js does this). Harness check (v10): empty ground mean 149.9/128.0/94.2, stddev 0.6–0.7 in a clean 100-px column, 1.1–1.3 where a crease crosses; `review/module-core-crease.png` is a 4× crop of a crease with its wear and the top band.

## ES5 rule that bit once

Closures created inside a `var` loop share the loop's variables (gen3 relied on `const` being block-scoped). `chunks` had exactly this bug on first render — every piece drew the last segment. Any `add(st,x,function(g){…})` inside a loop must go through a helper function or an IIFE, as `revealSilk` and `chunks` now do.

## tail.js ↔ main.js split

tail.js owns the page; main.js owns the composition. main.js is exactly this shape:

```js
new p5(function(p){
  var ctx=makeCtx(p), A=newApp(p,ctx);
  function build(){
    // phase A: specs, ctx.masks.stampWater(river polys), ctx.masks.stampZ(MOD.footprint(ctx,spec)) for everything,
    //          CROWD.place per zone + boat seats → figure specs → stampZ those too
    // phase B: every MOD.build(ctx,spec); TEXT.sign per signRect; TEXT.colophon; collector seals at ctx.SW-36
    finishBuild(A);
  }
  attachApp(A,build);
});
```

| tail.js export | does |
|---|---|
| `newApp(p,ctx)` | the state record: `g, silkImg, strokes, stageStart, drawn, progress, playing, dirty, camX, follow, speed, T=120, built, dragging, dragX0, camX0, lastPos, rec, chunks, checkpoints{}, boundaries{}` |
| `finishBuild(A)` | the ordering loop: sorts each `ctx.S[stage]` by descending x, concatenates into `A.strokes`, fills `A.stageStart`, sets checkpoint boundaries at `stageStart[ST.TREES]` and `stageStart[ST.OCHRE]`, `built=true` |
| `attachApp(A,build)` | `p.setup` (canvas `VW×CH`, `g` `SW×SH` pd 2, deep links `#p= #cam= #seq=`, font gate `fonts.load` on `ALL_TEXT` for Ma Shan Zheng / Noto Serif SC / Kaiti SC, then `bakeSilk → revealSilk → build → #seq replay`), `p.draw`, viewport + minimap drag, touch, steps/play/speed/progress/follow UI, keyboard, WebM recording (`qingming-wuhan-process.webm`), `syncTo/targetIndex/stageOf` with two checkpoints |
| title instance | second sketch, 470×74, seed 4242, Kaiti stack, warp/tilt/wander 0 |
| `</script>` | closes the script head.html opened |

Nothing in main.js touches the DOM, fonts, silk, `p.setup` or `p.draw`.

## Assembly

`head.html` already carries callig.js inline (head3.html lines 1–77 rewritten, then `<script>` + callig.js verbatim + `</script>` + an open `<script>`), so there is no separate `src/callig.js` in the cat:

```
cat src/head.html src/core.js \
    src/mod-arch.js src/mod-figure.js src/mod-boat.js src/mod-tree.js \
    src/mod-water.js src/mod-ground.js src/mod-crowd.js src/mod-text.js \
    src/main.js src/tail.js > qingming-wuhan.html
```

## Harness

`src/harness.html` = head.html (with `<base href="../">` so paths resolve from the project root) + core.js embedded between `/*CORE*/ … /*/CORE*/` + two `<script src>` lines + a driver. The driver builds `makeCtx(p,{SW:1200,CW:0})`, bakes silk, calls the global `sceneBuild(ctx)` the scene script defines, sorts every stage right→left and draws all strokes to a 1200×500 canvas at pixel density 2, then stops. The step buttons re-render through the chosen stage; the description shows stroke counts per stage and build time.

To test module X: write `src/mod-X.js` (contract IIFE) and `src/scene-X.js` (a `sceneBuild(ctx)` that stamps footprints, then calls `build`), point the two `<script src>` lines at them (or copy harness.html to `src/harness-X.html` — the `<base>` keeps the paths valid), then:

```
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1300,760 --virtual-time-budget=60000 --screenshot=/path/out.png \
  "file:///Users/rfy_naiveai/Desktop/qingming-wuhan/src/harness-X.html"
```

The canvas sits at page (45, 43), 1200×500; crop a 2.5× detail with `Image.open(p).crop((45+x0,43+y0,45+x1,43+y1)).resize(...)`.

After editing core.js, re-embed it into `src/harness.html` **and every `src/harness-*.html`** (loop the same substitution over `glob('src/harness*.html')`):

```
python3 -c "import re;p='src/harness.html';h=open(p).read();c=open('src/core.js').read();open(p,'w').write(re.sub(r'/\*CORE\*/\n.*?\n/\*/CORE\*/',lambda m:'/*CORE*/\n'+c+'\n/*/CORE*/',h,flags=re.S))"
```

`scene-sample.js` + `mod-sample.js` are the proof scene (two huts, a figure whose footprint breaks the hut's ruler lines behind it, a bare tree, bank 皴, water clusters, a 楷 sign, two seals) — every primitive once, incl. `rline`/`bline` clipping through `z`. Top-left ink proof (D-08): the same 30-px wavy stroke ×6 in the three `ctx.INK` grades, three 90-px rules (structural, texture, primary) closed by a primary vertical at their right end (a ruled corner, no bead), five thin water `pline`s, a junction of a primary shoulder line with a structural fold leaving it (no bead where they meet), four seals at 2× (sz 36: 取法 · 珍藏 · 審定 · 不取景), and below them the same 40-px wavy stroke ×2 in the four `ctx.INK.style` materials left to right (garment, branch, rock, rule). `review/module-core.png` is the last render; `review/module-core-ink.png` the crop of that corner, `review/module-core-seal.png` the 2× seals at 5×, `review/module-core-styles.png` the style row, `review/module-core-seal16.png` the two 16-px collector seals at 8×. In the headless screenshot the canvas sits at page (45, 75) because of the caption line above it.
