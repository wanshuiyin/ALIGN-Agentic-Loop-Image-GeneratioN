# 清明上河圖 · 武漢

A 5220 × 500 handscroll of Wuhan painted with 张择端's craft — 绢本淡设色工笔界画, ten stages
from 矾绢 to 复勾·题跋, 1 px ≈ 0.5 mm — by `/reference-art-loop` with a blind Codex reviewer.
Style transfer, not 临摹: the process, the stroke vocabulary, the colour rules, the blank-silk
rules and the three-part rhythm are the Song scroll's; every motif is Wuhan's, read right to left —
东湖 → 蛇山黄鹤楼 → 户部巷 → 武昌江滩 → 长江大桥 (the climax) → 龟山晴川阁 → 汉江 → 汉正街 →
江汉关 → 里份, colophon on the 拖尾. About 74 000 stroke objects from eight modules, ~450 figures,
24 boats, 65 buildings and the bridge, 190 trees, one train, no cars.

[Open the scroll](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/examples/qingming-wuhan/qingming-wuhan-preview.html#p=1) · [Replay all 11 versions](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/examples/qingming-wuhan/iterations/index.html)

## Layout

| path | what it is |
|---|---|
| `qingming-wuhan-preview.html` | the finished page, doctype-wrapped — **open this one** |
| `qingming-wuhan.html` | the same page as an artifact body (no doctype) |
| `full.png` | the finished scroll at 1:1, 5300 × 560 |
| `views/view-*.png` | the eight fixed viewports of the last round; `view-huanghelou` exists from v9 (D-17) |
| `evolution.png`, `evolution-detail.png` | one row per reviewed version: the bridge viewport (930 × 500) and its 2.5× crowd crop |
| `iterations/vN/` | each version’s runnable `qingming-wuhan-preview.html`, plus `full.jpg` (also `full.png` for v1 and the final), the 2.5× bridge-crowd and 户部巷 crops, the ten-stage process sheet the reviewer judged |
| `reference/` | the 故宫 张择端 scroll cut to 1 px ≈ 0.5 mm: full strip, style windows, 2.5× details |
| `src/` | `core.js`, `mod-*.js` (eight modules and a sample), `main.js` (composition), `head.html`, `tail.js`; per module a `scene-*.js` self-check and a harness page |
| `wiki/` | `plan.md`, `style-source.md`, `interfaces.md`, `gates.md`, `decisions.md` (D-01–D-22), `review-log.md` (v1–v11, B1–B11), `modules/`, the three composition `proposals/` and `judges.json` |
| `tools_assemble.sh`, `tools_render.sh` | rebuild the page from `src/`; render the eight views and the full scroll |

## Trajectory

Every round is blind: a fresh Codex thread gets the PNGs and the reference windows, never the
source. Scores are its own trajectory number, out of 10.

| version | round | reviewer | score | what changed | what cleared |
|---|---|---|---|---|---|
| v1 | B1 | gpt-5.6-sol | 3.5 | first integration of the eight modules | holds named: the itinerary, the moving viewpoint, the bridge diagonal, blank sky and water |
| v2 | B2 | gpt-6-astra xhigh (new baseline) | 4.5 | pressure on the ink line, event knots on the deck, continuous ground and hill bodies, S8/S9 thinned until the bridge is the peak | silk gradient, trees, lettering no longer dominant |
| v3 | B3 | gpt-6-astra | 5.5 | every foot on the deck behind the near rail, whole-silhouette occlusion, lines a quarter thinner with no hooks, tug moved behind the bridge | deck contact, line ends, ochre bands, seals; the 起稿 and 水纹 stages |
| v4 | B4 | gpt-6-astra | 6.0 | action groups sharing one contact point, streets built as one structure, 复勾 only where something bears | street rows, the single stroke template; 户部巷's middle rows called the first near-finished passage |
| v5 | B5 | gpt-6-astra | 6.0 | one continuous dark plane under every eave, hull, chord and bank lip; tug built to its clearance; a 转角街屋 at 汉阳 | tug mast, boat shells, colour gathering to the shaded side — trees regressed into Y-forks |
| v6 | B6 | gpt-6-astra | 6.3 | trees reverted to v4 plus the trunk carried into the crown; 积墨 under 户部巷's eaves; hills with a flat foot | trees, hills; four passages named as holding |
| v7 | B7 | gpt-6-astra | 6.5 | girder shade band, far members dropped a grade, figure widths restored, 汉正街 through-unit, 磨山 valley, one barge load, colophon in 楷 | barge, tree tips, lettering — new tell: the silk's gradient over the river |
| v8 | B8 | gpt-6-astra | 6.7 | the whole girder belly, heaviest stroke at each pier top, open-water bands removed, closed figure outlines | silk gradient; near span "barely stands" |
| v9 | B9 | gpt-6-astra | 6.8 | figures as silhouettes traced from the original (fifth figure primitive), pooled ink at the pier joints, valley open at its mouth, silk without stains | 磨山, girder (down to the pier "墨扣"); city named as Wuhan from 江汉关, 黄鹤楼, the TV tower and the long bridge |
| v10 | B10 | gpt-6-astra | 6.8 | 黄鹤楼 at 360 px as the built climax, 桥头堡 twin towers, boards readable, ink into roofs/eaves/hulls/trunks/heads, silk 6% darker and warmer with creases, 淡设色 layers, fine water texture across the river (D-17–D-19); the wall-occlusion bug of nine rounds fixed (D-20) | 黄鹤楼 named the architectural climax; ground and 朱砂 done; the river texture judged the round's regression 「读作图案」 |
| v11 | B11 | gpt-6-astra | 7.0 | water as long lines following the current, 桥头堡 as broad blocks running into the abutment, train in the rail deck, the tower's middle colonnade, action-decided outlines for the large figures, leaf masses, colophon rhythm (D-21) | 桥头堡, leaf masses, colophon no longer dominant; eight passages hold; stopped here (D-22) |

## What holds

Passages the reviewer confirmed round after round (B6–B11) and told the executor not to touch:
the 豆皮 stall in 户部巷 (board, counter, the bowl handed across, eaters in front); the 东湖 huts
and the sitter beside the grove; the 转角楼 at the 汉阳 end; 江汉关 with the ferry queue on its
steps; the barge's near gunwale and separate low loads under the bridge (from B7); the near span
of the bridge (from B9); 黄鹤楼 with its terrace and the climbers on the stair (from B10); the
桥头堡–stair–bank node where the bridge lands (B11). Structural holds since B1: right-to-left
unfolding, the elevated moving viewpoint, the bridge diagonal as spine, blank sky, restraint of
朱砂, the 拖尾 and seals.

## The reviewer's closing judgement (B11)

> 此卷是一件以程序作画、取绢本淡设色与界画语汇写当代武汉的风俗长卷。它已将湖山、桥市、街巷与舟渡贯成可游可读的城市,几处铺前、候渡与登临场面尤其成立。其长处在空间经营、舟桥屋宇的接合,以及设色的节制;其短处在人物尚多同形,水纹与构件仍露等量重复,笔墨随物赋形的能力不足。武汉已经入卷,宋人风俗画中各人有事、各笔有着落的生气,尚须继续画进去。

Asked which city this is from the picture alone: 「这是武汉。黄鹤楼与蛇山、双层长江大桥、龟山上的电视塔、江汉关钟楼和轮渡共同指认了它。」 The gate as written in `wiki/gates.md` was not passed; the run stopped by decision (D-22) with the next repaint named: the three figures at the e-bike as one force-shape, and water lines grouped as one current.

## Decisions worth quoting

**D-01** — 「取《清明上河图》的工序、笔触词汇、设色法、留白法则和三段节奏;构图、母题全部是武汉的。
画心内无题名,跋在拖尾。盲评问"像不像绢本淡设色工笔界画的产物",不问"像不像那幅画"。」

**D-07** — the reviewer found the density climax in the left city; the plan had already said
「桥必须是峰,S8 超了先砍 S8」. Deck crowd from an even stream to unequal event knots, two or three
boat-and-pier events under it, clean river before and after.

**D-13** — a tree primitive was tried and judged worse than the version before it. 「一条原语改动之
后评审判退步,就退回上一版再做最小改动,不在退步的基础上继续叠。」

**D-17** — the user could not find 黄鹤楼. It stood 300 px tall between two viewports nobody
rendered, and Rule 4 (landmarks ≤ 25 % of station width, always partly hidden) had painted it pale
behind pines. New fixed view `view-huanghelou`, full 360 px, the heaviest 界画 in the scroll, occlusion
only at its foot. 「桥是人的高潮,楼是建筑的高潮。」

**D-18** — 「"取其法不取其景"里的景就是武汉,认不出武汉即景未到位。」 Bridge towers, the double
deck with the train below, 「戶部巷」 and its food boards, the 江汉关 clock, the TV tower and 晴川阁
all exempt from Rule 4; a new blind question — 「只看图,你认得出这是哪座城市吗,凭什么?」

**D-19** — the user asked for 丹青 and aging; the reviewer measured the scroll as 「物象未沉、色层未
足」 and prescribed ink mass first, silk 5–8 % darker second, transparent colour third. One
prescription overruled by the reference: it said 「水面不需要满铺水纹」, but the 汴河 in the original
is covered with fine lines, so the earlier 「江心留白」 rule (D-05) was the reconstruction error.

## Open it, scrub it

Open `qingming-wuhan-preview.html` in Chrome or Edge (fonts come from Google Fonts; the colophon
uses Kaiti SC where installed). ▶ 播放 paints the ten stages in 120 s at 1×; the slider scrubs;
the ten stage buttons jump to a stage; 镜头自右向左展卷 makes the viewport follow the brush; drag
the scroll or the minimap to look elsewhere; ● 一键录制 WebM records a play-through.

Deep links: `#p=0.45` progress 0–1 · `#cam=0.577` viewport, 0 = 拖尾 end, 1 = 东湖 end ·
`#seq=1,0.35,0.7,1` a scrub sequence (the G-01 determinism check renders this against `#p=1`
and expects 0 differing pixels) · `#full=1` the whole scroll at 1:1 with the chrome hidden.
The eight cams: left 0 · jianghanguan 0.145 · hanzhengjie 0.259 · qingchuan 0.465 · bridge 0.577
· huanghelou 0.727 · hubuxiang 0.901 · right 1.

## Re-render

`bash tools_assemble.sh` concatenates `src/` into both html files; `bash tools_render.sh out/`
renders the eight views and the full scroll with headless Edge. One view by hand:

```
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1000,700 --virtual-time-budget=240000 --screenshot=view-bridge.png \
  "file://$PWD/qingming-wuhan-preview.html#p=1&cam=0.577"
```

For the full scroll use `--window-size=5300,560` and `#full=1`. Any Chromium works; swap the
binary path.

The bundled p5.js 1.9.4 runs locally. Google Fonts still requires a connection; local font fallbacks are used when unavailable.
