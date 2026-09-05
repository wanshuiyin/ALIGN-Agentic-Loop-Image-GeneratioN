# 清明上河圖 · 武漢 — reuse-and-interface plan

Source surveyed: `qianli-process/src/{head3.html,callig.js,gen3.js,tail3.js}` (assembled as `cat head3.html gen3.js tail3.js > qianli.html`; head3.html carries callig.js inline at lines 78–155 and opens the second `<script>` at line 156, tail3.js closes it), plus `wiki/decisions.md` D-01…D-25.

---

## 1. What transfers unchanged

Everything below lives inside `new p5(p=>{…})` in gen3.js or in callig.js/tail3.js. Names and signatures are the ones parallel authors will see in `ctx` (§3).

| Piece | Where | Signature / shape | Needs |
|---|---|---|---|
| Stroke object | gen3 L23–25 | `{x, f(g)}`; `S=STAGES.map(()=>[])`, `add=(st,x,f)=>S[st].push({x,f})` | `f` contains **no randomness and no state mutation** (D-05, G-01 replay identity). |
| Stage ordering | gen3 L251–252 | `S.forEach((arr,i)=>{arr.sort((a,b)=>b.x-a.x); stageStart[i]=idx; …}); stageStart.push(idx); boundaries=new Set([…].map(i=>stageStart[i]))` | Runs once at the end of `build()`. Right-to-left inside each stage = the brush front the viewer sees. |
| Build-time RNG | gen3 L21–22 | `seed=20230904; R()` mulberry32; `rr(a,b)`, `ri(a,b)` (inclusive both ends), `clamp(v,a,b)`, `smoothstep(a,b,v)`, `col(c,a)→[r,g,b,a]`; `p.noiseSeed(7)` + `p.noise` | Never `Math.random`/`p.random` anywhere. |
| Line primitives | gen3 L102–103 | `line(st,x,c,al,w,x1,y1,x2,y2)` ROUND cap; `pline(st,x,c,al,w,pts,curve)` pts=`[[x,y],…]`, drops <2 pts, `curve` → curveVertex with doubled ends | `add`, `col`. |
| Pressure outline | gen3 L140 `outline(st,pts,w,al)` (local to mountains) | jitter ±0.3 px; three pieces at 35 % / 72 % with widths ×0.6 / ×1.25 / ×0.7 and alpha ×0.8 / ×1 / ×0.85 | Lift verbatim into ctx as `bline` (§3). This *is* the 白描 line. |
| Segmenting long marks | gen3 L177–179 `chunks(st,pts,c,al,sw,len)` | 70–190 px pieces, adjacent pieces share exactly one point, PROJECT cap, constant alpha per row (D-15) | Reuse for water and any mark > 60 px. |
| Pigment dabs | gen3 L108–111 `dabsIf(m,k,st,c0,ink,step,rad,pred)` | Jittered grid `step`, radius `rad·e^U(−0.6,0.55)`, `OVER=π·rad²/step²`, `a=1−(1−ink)^(1/OVER)`, radial gradient stops 0 / 0.6 (×0.85) / 1, ≤8 dabs per stroke object, optional ellipse angle in `d[4]`, `tone` mixes colour toward `[150,150,140]` | Keep the flush body and the alpha formula byte-for-byte; only the region/occlusion plumbing changes (§3 `dabs`). |
| Brush-text engine | callig.js `makeBrushText(R)` → `{brushText(o), stampDabs(g,dabs,ink)}` | `o={text,x,y,size,font,colGap,perCol=14,dir=-1,horizontal,lineH=1.08,over,ink=.8,SS=6,warp=.012,dry=1,tilt=.8,wander=.5}` → `items[{x,y,ch,comps:[[{x,y,r,a}…]],tone}]`; stamp with `add(st,it.x,g=>{for(const c of it.comps)B.stampDabs(g,c,C.ink)})` | `document.fonts.load('<size>px "<font>"', ALL_TEXT)` **before** `build()` with every string that will be rasterized (D-08 坑一). Keep D-18/D-25 settings: warp ≤0.012, tilt ≤0.8°, wander ≤0.5; for 楷 招牌 use warp 0 / tilt 0 / wander 0. |
| Seals | gen3 L236–241 `sealStamp(st,x,y,sz,text)` | 2 or 4 chars, 3 offset 印泥 layers (0.8 / 0.22 / 0.22), white 文, 30 edge chips, rotation ±3° | Move out of `build()` into core so the text module can call it. |
| Silk bake | gen3 L255–263 `bakeSilk()`; stage-0 reveal L133 | `silkImg=p.createGraphics(SW,SH)`, paper rect `0..CW`, ±3 grain, warp/weft lines every 1.3 / 1.6 px, 12 000 fibres, 9 blobs r 400–900 + 40 blobs r 100–300, 1 px boundary at `CW`; reveal in 50-px columns `add(0,a+25,g=>g.image(silkImg,a,0,w,SH,a,0,w,SH))` | `C.silk/silkDk/paper`, `SW,SH,CW`. Silk colour is the integrator's call; 清明上河图 silk is browner/greyer than 千里 — start from `[160,140,106]`. |
| Base | gen3 L264 `base()` | `g.background(...C.silk)` | |
| Checkpoint replay | tail3 L1–6 | `targetIndex(t)`, `syncTo(t)` (rewind → nearest checkpoint ≤ target, replay forward, snapshot at `boundaries`), `stageOf(t)`; `checkpoints=new Map()` | Two snapshots max (D-06: ~42 MB each at 5220×500×pd2). |
| Page chrome | head3.html | DOM ids `#ttl #stage #play #speed #prog #pct #follow #rec #steps #dname #dsub #dtext`; `.steps{grid-template-columns:repeat(10,1fr)}`; theme tokens; fonts link (Ma Shan Zheng, Noto Serif SC, IBM Plex Mono) | Edit only: `<title>`, header `<p>`, `.note`, the 10-column grid if stage count ≠ 10. |
| UI + lifecycle | tail3 L7–41 | steps buttons from `STAGES`, play/speed/prog/follow, keyboard (Space, ←/→ = 80 px), viewport drag + minimap drag, `p.setup` (`createCanvas(VW,CH)`, `g=createGraphics(SW,SH)`, pd 2, `T=120` s), `p.draw` (follow: `camX=(1−progress)·(SW−VW)`; minimap + red viewport rect + red brush-front dot at `lastPos`) | `VW=930, VH=500, MMH=round(VW/SW·SH), GAP=12, CH=VH+GAP+MMH`. |
| Deep links | tail3 L28 | `#p=` progress 0–1, `#cam=` 0–1, `#seq=a,b,c` scrub sequence (G-01) | unchanged |
| Recording | tail3 L16–24 | `MediaRecorder(p.canvas.captureStream(30),{videoBitsPerSecond:8e6})`, vp9→webm, `window.claude.use('downloads')` else anchor | change filename to `qingming-wuhan-process.webm` |
| Title instance | tail3 L45–48 | second `new p5(q=>…)`, 470×74, seed 4242, `brushText` size 40 horizontal, over 9, ink .95, dry .3, warp/tilt/wander 0, font `"Kaiti SC","STKaiti","KaiTi","Ma Shan Zheng"` | text → `清明上河圖 · 武漢` |

**Does not transfer** (domain code): `mkMountain`, `M/front/hiddenBy(k,…)`, `BARS/makeBar`, `raster/buildMask/MASK_NEAR`, `colourRun` (D-11 retired it), 网巾纹 rows, `dianYe/jiaYe/song/liu` (8–16 px trees), `compound/footpath`, waterfalls, the 13-px bridge and boat, `silkMist`. The mask *idea* (two `Uint8Array(SW*SH)` rasters, `maskAt` treats `x<CW` as blocked, `clearAround(fn,x,y,r)` 5-point probe) transfers; its data source changes (§3).

---

## 2. What must be new for a 工笔白描 handscroll

### Scale and stage plan (shared facts every module assumes)

- Canvas `SH=500`, `PW=5000`, `CW=220` (拖尾纸), `SW=5220`. 24.8 cm → 500 px: **1 px = 0.5 mm**. Standing figure 45–60 px, head 7–8 px, single-storey shop eave 100–130 px, 黄鹤楼 5 tiers ≈ 360 px, 江汉关 tower ≈ 260 px, 龟山电视塔 ≈ 440 px, 长江大桥 900–1200 px span with deck at y ≈ 190–215, 轮渡 220–300 px long, 货船 150–250, 游船 120–180, 渔船 40–70, 柳 80–160 px, 法国梧桐 100–180, 樱 60–100.
- Line grades (analogue of D-22's three grades): **界画 ruler line** 0.6–0.9 px, alpha 170–210, PROJECT cap, 0.5–1.5 px overshoot at joints; **白描 line** 0.45–0.85 px, alpha 190–230, three-piece pressure (`bline`); **texture** (皴、点叶、水纹) 0.35–0.55 px, alpha 60–120.
- 淡设色 coverage targets for `dabs` `ink`: 赭石 on wood/walls/ground/skin 0.25–0.4; 花青 on roofs/篷/some robes 0.2–0.35, on water 0.08–0.15 in bands; 淡墨 under eaves / on trunks 0.15–0.25; 朱砂 on 招牌边、灯笼、幌子、船旗 0.5–0.7 (≤ 2 % of painted area). Dab grid for small parts: step 2.5–3.5, rad 2.5–3.5. Sky, mid-river, road centres stay blank silk.
- **Stages** (10, so the `.steps` grid stays as is), exported as `ST`:

| idx | name | contents |
|---|---|---|
| 0 | 矾绢 | silk reveal (unchanged) |
| 1 | 起稿·地势 `DRAFT` | 淡墨 (alpha 60–90, 0.5 px) bank lines, road edges, wall footprints, 台基 lines, bridge axis — the layout skeleton |
| 2 | 界画 `JIEHUA` | all ruler-line architecture and bridges: 柱网、额枋、斗拱、屋顶、瓦垄、门窗、栏杆、台阶、堤石 |
| 3 | 舟船 `BOATS` | hulls, 舱棚, 桅, 橹, 舵, 轮渡 decks |
| 4 | 树石 `TREES` | trunks, 鹿角/蟹爪 branching, banks, rocks, grass; 点叶 where leafed |
| 5 | 人物 `FIGURES` | all 白描 figures and props, incl. boat crews |
| 6 | 水纹 `WATER` | short curved clustered strokes, wakes, eddies at piers |
| 7 | 淡设色·赭石 `OCHRE` | 赭石 washes: wood, walls, hulls, ground, skin |
| 8 | 淡设色·花青·朱砂 `INDIGO` | 花青 roofs/篷/robes/water bands; 淡墨 shading; 朱砂 accents |
| 9 | 复勾·招牌·题跋 `FINISH` | 复勾 at eaves/corners (alpha 90–120), 招牌 text, 樱花 点, colophon, seals |

Checkpoint `boundaries = [ST.TREES, ST.OCHRE]`.

### (a) `mod-arch.js` — 界画 architecture
Parametric Song building from `{x,y,w,d,h,storeys,roof,dir,z,bays,sign,awning}` where `(x,y)` is the ground contact of the front-right corner, `w` frontage, `d` depth along `ctx.OBL`, `h` eave height. Parts (all `rline`, stage `JIEHUA`): 台基 2–3 lines 3–6 px tall; 柱 as line pairs 2 px apart, bay 20–28 px; 阑额/额枋 two horizontals 3 px apart; 斗拱 simplified to a 工-shaped 6×4 px bracket per column top plus 2 intermediate; 屋顶 kinds `xieshan | xuanshan | wudian | zanjian`: eave line with 翘角 lifted 3–6 px at ends, 正脊, 垂脊, 瓦垄 as lines every 3–4 px down the slope, 瓦当 dots r 0.7 every 3–4 px along the eave; 门窗: 直棂窗 bars every 2–3 px inside a frame, 板门 two leaves with 门钉 dots; 招牌: hanging board 8×24 px or vertical 幌子 4×30 px (text delegated to TEXT via a returned slot); 凉棚 on 4 poles with mat hatch every 2 px. Colour: `OCHRE` wash on columns/doors/walls, `INDIGO` wash on roof slopes (dense at ridge, thinning to eave) + 淡墨 band 3–5 px under each eave; `FINISH` 复勾 of eave and 翘角.
Modern kinds on the same primitives: `jianghanguan` (8-column colonnade as 柱网, cornice as 额枋, 3 storeys of 直棂-style windows, clock tower = 3 stacked 楼阁 tiers, clock face circle with 12 ticks, cupola as 攒尖); `huanghelou` (5 tiers × `xieshan` roof with 平座 balconies 60–70 px apart, 4-way 翘角, 攒尖 top); `qingchuange` (3 tiers on a stone 台); `tvtower` (two tapered ruler lines 14 → 6 px apart, 6 ring ledges, observation disc as ellipse 90×22 px with a 界画 window band, antenna 1 line 70 px, 花青 wash); `bridge` (长江大桥: chords 22 px apart, verticals every 24 px, Warren diagonals, upper deck with 栏杆 posts every 8 px, lower rail deck, 8 stone piers as blocks with 分水尖, 桥头堡 as 4-tier pavilions) — also a Song timber `hongqiao` variant for 汉江 footbridges; `wharf` (趸船 + 跳板 + 栏杆); `wall`, `steps`, `embankment` (stone courses 6×14 px). Returns footprint (§3) and slots `{door, counter, signRect, eaveLine, deckZone}`.

### (b) `mod-figure.js` — figures
Pose library `POSES[name] = {strokes:[{pts:[[u,v]…], w, curve, kind}], width, props}` in unit coordinates (height 1 = figure height, origin at feet centre, +u = facing direction); 5–9 strokes per pose: head (two arcs), 幞头/hat/hair (1), 衣身 with 2–3 衣纹 folds as one polyline (1–2), sleeves/arms (1–2), 裙/裤 hem and feet (1–2), prop (0–2). 25–35 poses: stand, walk L/R ×2 phases, 扁担 with two baskets, open 伞, 手机 (head down, arm bent), eating 热干面 (bowl at chest, chopsticks), squat, sit on stool, push 自行车, ride 电动车, child by hand, vendor upper-body behind counter, boatman poling / rowing, porter sack on shoulder, talking pair, pointing, old man with stick, woman with basket, photographer, queue stand (arms folded), sweeping, pulling cart, at ferry rail, leaning, running child, tourist with backpack, 卖菜 squatting with basket, 跳广场舞 pair. `build(ctx,{x,y,h,pose,dir,z,tint})`: `bline` in `FIGURES`; `OCHRE` 2–3 dabs r 2 on face/hands; `INDIGO` robe wash on 40 % of figures, 朱砂 on 8 %. Footprint width 0.35 h (0.6 h with 扁担/伞/bike/cart).

### (c) `mod-boat.js` — boats
Song construction: flat bottom, squared bow, 2–4 planking lines along the hull, 舱棚 as an arched mat roof with hatch every 2 px, 桅 with furled sail or 纤绳, 橹 at stern, 舵. Kinds: `ferry` 轮渡 (two decks as 界画 window rows every 6 px, funnel, 栏杆, lifebuoy circles r 3, 朱砂 waterline band), `cargo` (low, cargo mounds as arcs under tarp, stern cabin), `fishing` (one figure, net as 4×4 px grid), `pleasure` 游船/画舫 (楼船 roof from the arch module's `xieshan` at 0.5 scale), `sampan`. `build(ctx,{x,y,type,len,dir,z,moving})` → footprint (hull + cabin polygon) and `seats:[{x,y,pose,dir}]` for the figure module; registers into `ctx.reg.boats` so water can clip and draw wakes.

### (d) `mod-tree.js` — trees and banks
The signature of 清明上河图 trees is **bare 鹿角/蟹爪 branching** (early spring); the Wuhan 清明 keeps that for 槐/梧桐 and leafs only 柳 and 樱. Trunk: two `bline`s 2–5 px apart with 节疤 knots, tapering; recursive branching 3–4 levels, fork angle 25–40°, length ratio 0.55–0.7, 蟹爪 tips of 3–5 short strokes; leaf modes `none | liu (垂条 6–10 per branch) | jiezi (介字点) | ying (樱: 1.5 px silk-light dots + 淡朱砂)`; `INDIGO` 淡墨 wash on the shaded trunk side. Banks: 坡岸 outline in `DRAFT`, 短皴 4–10 px in `TREES`, rocks in 折带 outline, grass tufts 3–5 lines; `OCHRE` wash. `build(ctx,{x,y,h,kind,dir,z})` → footprint (trunk rect; plus canopy ellipse only for leafed trees).

### (e) `mod-water.js` — water
Clusters of 4–9 nearly parallel short curved strokes, length 8–24 px, spacing 1.6–2.6 px, width 0.35–0.5, alpha 60–110, curvature following a per-band flow field (长江 westward-to-eastward, 汉江 joining at 龙王庙; two currents meet as opposed cluster directions). Blank silk between clusters (cluster gap 10–40 px), denser within 30 px of hulls, banks and piers, V-wakes behind moving boats. Clips against `masks.hidden` and `ctx.reg.boats`. `build(ctx,{x0,x1,yTop(x),yBot(x),flow,density})`; `INDIGO` adds 花青 bands (ink 0.08–0.15, one whole stroke per row, D-22 "不分段").

### (f) `mod-ground.js` — roads, ground, walls
Ground is blank silk plus `OCHRE` wash at 0.15–0.3 with holes; road edges as broken `DRAFT` lines (segments 30–60 px, 20 % missing), 斑马线 as 5–7 wash gaps 4×12 px, 江滩 railings (posts every 8 px), 台阶 down to water (8–14 lines), 围墙 with 瓦顶, 树池 squares, 公交站牌 pole. `build(ctx,{zone})`.

### (g) `mod-crowd.js` — placement grammar (places, never draws)
`place(ctx,{zone,density,mix,focus})` → array of figure specs. Rules: **queue** n=4–9 spaced 0.45–0.6 h along a line ending at a slot (热干面 counter, ferry gate), all facing the slot, 30 % on 手机; **cluster** 3–6 around a focus within 0.8–1.5 h facing inward; **stream** along a street band both directions, spacing 0.7–1.4 h, 25 % pairs at 0.35 h, 20 % carrying; **density** per 100 px of zone length: 汉正街/户部巷 4–6, 江滩 2–3, 桥面 1–2, 东湖 0.5–1; **depth**: y within the zone band, `h = 60·ctx.depth(y)`, z = y; overlap of footprint boxes allowed 20–40 % only when z differs by ≥ 6; never inside `masks.solidAt`; boat seats come from `ctx.reg.boats[i].seats`.

### (h) `mod-text.js` — 招牌 and colophon
`sign(ctx,{x,y,text,size,vertical,style,z})`: 楷 via `brushText` (font `"Kaiti SC","STKaiti","KaiTi","Noto Serif SC"`, size 9–13, over 5, ink 0.9, dry 0, warp 0, tilt 0, wander 0) in `FINISH`; 朱砂 board edge optional. `colophon(ctx,{text,x,y,size,perCol,colGap})`: 行书 via `brushText` (font `"Xingkai SC","Ma Shan Zheng"`, size 18, perCol 14, colGap 24, over 6, ink .82, wander .3) — column count = ceil(len/perCol), must fit `CW` (D-25); seals below the last column. 画心 carries **no title** (the original has none; 张著 跋 is on the 拖尾) — only collector seals at the right end. `seal = ctx.sealStamp`.

---

## 3. Module interface

### File shape
Each module is one top-level ES5 IIFE in the shared `<script>`, no p5 globals, no DOM, no `Math.random`:

```js
var ARCH = (function(){
  function footprint(ctx, spec){ /* pure: no add() */ return {x0,x1,y0,y1,z,inside(x,y)}; }
  function build(ctx, spec){ /* ctx.add(...) only */ return {fp, slots}; }
  return {footprint, build};
})();
```
`FIGURE`, `BOAT`, `TREE`, `GROUND` follow the same shape. `WATER` has only `build`. `CROWD` has only `place(ctx,zone)→specs`. `TEXT` has `sign`, `colophon`.

Two-phase contract (this is how occlusion works without fills): the integrator calls every `footprint()` first, stamps them into the z-mask, and only then calls every `build()`. A `build()` may therefore assume the mask is complete.

### Context object `ctx` (built by `makeCtx(p)` in core.js; names match gen3.js)

```
SW, SH, CW, PW              5220, 500, 220, 5000 — 画心 is x∈[CW,SW); x<CW is 拖尾纸
Y_FAR=140, Y_NEAR=480       usable ground band; sky above Y_FAR is blank silk (tall things may cross it)
depth(y)                    0.75 + 0.25·clamp((y−Y_FAR)/(Y_NEAR−Y_FAR)) — figure h = 60·depth(y)
OBL=[-0.45,-0.55]           oblique depth vector (per unit depth: 0.45 left, 0.55 up); all boxes and decks use it
ST                          {SILK:0,DRAFT:1,JIEHUA:2,BOATS:3,TREES:4,FIGURES:5,WATER:6,OCHRE:7,INDIGO:8,FINISH:9}
C                           {silk,silkDk,paper,ink,ochre,ochre2,huaqing,huaqing2,danmo,zhusha,tenghuang,tree,trunk,red}
R(), rr(a,b), ri(a,b), clamp(v,a,b), smoothstep(a,b,v), noise(x,y)=p.noise, col(c,a)
add(st,x,f)                 stroke object {x,f}; x = the mark's rightmost x; marks wider than 60 px are split (use chunks)
line(st,x,c,al,w,x1,y1,x2,y2)                      gen3 L102 (ROUND)
pline(st,x,c,al,w,pts,curve)                        gen3 L103
rline(st,x,c,al,w,x1,y1,x2,y2,z,over)               NEW: ruler line, PROJECT cap, no jitter, `over` overshoot px
                                                    (default rr(0.5,1.5)); when z given, clipped by masks.hidden every 2 px
bline(st,x,c,al,w,pts,z)                            gen3 L140 outline() lifted: ±0.3 jitter, 3-piece pressure; clipped when z given
chunks(st,pts,c,al,sw,len)                          gen3 L177
dabs(st,reg,c,ink,step,rad,pred,opts)               gen3 L108 dabsIf with reg={x0,x1,y0,y1,z,inside(x,y),edge?(x,y),tone?}
                                                    pred(x,y)→bool optional; opts {pool:bool, angle:fn(x,y)}
wash(st,poly,c,ink,step,rad,z)                      dabs over a polygon
brush                       makeBrushText(R) → {brushText, stampDabs}
sealStamp(st,x,y,sz,text)   gen3 L236
masks
  .stampZ(fp)               writes fp.z into Uint16 Z[SW*SH] where fp.inside and z > existing
  .hidden(x,y,z)            x<CW || Z[y*SW+x] > z+1     (nearer object occupies the pixel)
  .solidAt(x,y)             Z[...] > 0
  .stampWater(poly) / .waterAt(x,y)     Uint8 water raster from integrator's river polygons
  .clearAround(fn,x,y,r)    gen3 L97
reg                         {buildings:[], boats:[], trees:[], figures:[], zones:[], slots:[]} — every build() pushes its {fp,slots}
```

### Conventions
- **Coordinates**: y down; ground contact `(x,y)` is the bottom-centre (figures, trees) or front-right corner (buildings, boats); `z` defaults to `y`; a figure on a boat passes the boat's `z`.
- **Reading direction**: right → left; segment 0 is the right end (郊野·东湖), the 拖尾 is at the left; within a stage strokes fire by descending `x`.
- **Occlusion**: no silk fills. A hidden line is simply not drawn — `rline/bline` with `z` clip themselves; `dabs` skips hidden cells; free-hand marks call `masks.hidden` on their sample points. Bare trees register trunk only; leafed trees add the canopy ellipse.
- **Stroke object**: `{x, f(g)}`; `f` uses only values captured at build time (D-05).
- **Text**: any string a module rasterizes must come from `spec` (integrator-supplied `SIGN_TEXTS`) so it can be in the `document.fonts.load` call.

---

## 4. Assembly

```
cat src/head.html src/callig.js src/core.js \
    src/mod-arch.js src/mod-figure.js src/mod-boat.js src/mod-tree.js \
    src/mod-water.js src/mod-ground.js src/mod-crowd.js src/mod-text.js \
    src/main.js src/tail.js > qingming-wuhan.html
```
`head.html` = head3.html lines 1–77 with title/subtitle/note rewritten, ending with the p5 1.9.4 `<script src>` and an open `<script>`; `callig.js` verbatim; `core.js` = constants, `C`, `STAGES`, `ST`, `makeCtx(p)` (RNG, add/S, line/pline/rline/bline/chunks/dabs/wash, masks, sealStamp, brush), `bakeSilk(p,ctx)`; modules as above; `main.js` = `new p5(p=>{…})` holding state, `build()`, and the ordering loop; `tail.js` = tail3.js with filename, title string and font-load list changed and the closing `</script>`.

The integration author writes: (1) `STAGES` texts and `COLOPHON` (60–90 chars, new 跋 for the Wuhan scroll), `SIGN_TEXTS`, `ALL_TEXT = COLOPHON + SIGN_TEXTS.join('') + title + seal texts`; (2) the composition in `build()`: 6–8 segments right → left with x ranges (东湖 → 户部巷/汉正街 → 黄鹤楼·长江大桥 → 江汉关·轮渡 → 晴川阁·龟山塔 → 拖尾), river polygons for 长江/汉江 with flow, street/quay/bridge-deck zones; (3) phase A: create all specs, `masks.stampWater`, `masks.stampZ(MOD.footprint(ctx,spec))` for everything, then `CROWD.place` per zone and boat seats → figure specs → stamp those too; (4) phase B: call every `build()`, then `TEXT.sign` for each building `signRect`, `TEXT.colophon`, collector seals at `SW−36`; (5) the unchanged ordering loop and `boundaries=[ST.TREES, ST.OCHRE]`; (6) `p.noiseSeed(7)`, the seed constant, and the `fonts.load(ALL_TEXT)` gate before `bakeSilk(); build();`.