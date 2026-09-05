# Plan · 清明上河圖 · 武漢

Style source: `wiki/style-source.md` (张择端本,1 px ≈ 0.5 mm at 500 px). Module contract: `wiki/interfaces.md`. This file is the composition and the rules every module and the integrator follow. Decided 2026-09-04 from three composition proposals (`wiki/proposals/`) judged by three lenses (`wiki/judges.json`): proposal 2 (江河优先) is the skeleton; the grafts below were adopted where two or more judges agreed.

**CRAFT_CLAIM**:绢本淡设色工笔界画长卷(北宋院体风俗画一路),细绢上淡墨中锋白描与界尺直线起骨、淡墨分染、赭石花青薄罩、朱砂点缀;在 930 px 视口、1 px ≈ 0.5 mm 下读作毛笔所作。这是**风格迁移**:取其法(工序、笔触词汇、设色法、留白法则、三段节奏),不取其景。画心内无题名。

## Canvas
`SH=500, PW=5000, CW=220, SW=5220`; 画心 x∈[220,5220),拖尾 x<220。Read right → left. `Y_FAR=140`(sky above is blank silk; only 黄鹤楼、江汉关、电视塔、桥头堡 may cross it), `Y_NEAR=480`. Figure height 60·depth(y), i.e. 45–60 px. Ten stages (see interfaces §2), checkpoints at TREES and OCHRE.

## The loop the reader walks (真实地理顺序,河道服从手卷)
东湖 → 蛇山黄鹤楼 → 户部巷·中华路码头 → 武昌江滩(呼吸)→ 长江大桥(高潮,黄鹤楼在桥头 400 px 内)→ 龟山·晴川阁·铁门关(电视塔淡远)→ 渡汉江·两江交汇 → 集家嘴·汉正街 → 江汉关·武汉关码头·江汉路 → 中山大道里份(戛然而止)→ 拖尾跋。

## Stations, right → left (x ranges on the 5220 canvas; 画心 starts at 220)

| # | x range | station | people | boats | buildings | trees | notes |
|---|---|---|---|---|---|---|---|
| S0 | 5220–5020 | 引首 | 0 | 0 | 0 | 3 mist tops | collector seals at SW−36; blank |
| S1 | 5020–4560 | 东湖郊野 | ≤30 | 2 划子 | 4 农舍 + 1 亭 | 34: 柳 12, 桃 4, 樱 3(晚樱, 淡朱点 ≤12%), 杂 15 | lake y 70–170 **blank silk**; 磨山 pale 花青 far hills no outline; 凌波门栈桥 100 px into the lake with 10 students sitting legs down (no crowd, no 武大); 藕田 ridges; 三轮 2, 板车 1, 共享单车 4 |
| S2 | 4560–4100 | 户部巷·中华路码头 | ≈70 | 轮渡 1 docked, 趸船 1, 海事艇 1 | 22 shops (two-storey 仿古), 牌坊「戶部巷」, 售票亭 | 梧桐 8 (bare, seed balls), 柳 6 | 长江 enters y 80–290 widening leftward; food stalls: 热干面 3, 豆皮 2, 汤包 1 (steamer towers as ruler cylinders), customers **standing eating from bowls**; queue 14 at the ferry gate, e-bikes 8 on the lower deck; steam = blank + one wisp of 淡墨 |
| S3 | 4100–3760 | 武昌江滩(呼吸) | ≤40 | 顶推船队 1+4 downstream, 楼船「知音号」1 far, 海事艇 1 | 亭 1, 防洪墙, 售货亭 2 | 柳 14, 梧桐 6 | open river y 70–300, water lines only within 40 px of hulls and banks; 汉阳门 steps with 冬泳队 6 on steps + 4 heads in water with 朱砂 float balls (3 px); 放风筝 3; 婚纱 = blank silk |
| S4 | 3760–3320 | 蛇山·黄鹤楼 | 36 | 0 | 黄鹤楼 (5 tiers, ≈360 px, roof 淡赭 not yellow), 白云阁 smaller behind, 碑亭, 山门 | 松 14, 杂 16 | ridge y 200–430; the tower stands **within 400 px right of the Wuchang 桥头堡** so 黄鹤楼—桥—电视塔 form one diagonal ("龟蛇锁大江"); stairs with 18 climbers; landmark ≤25% of station width and partly hidden by pines |
| S5 | 3320–2560 | 长江大桥(高潮) | **≥160** | 拖轮 1 (150–180 px, folded mast at 45°, 3 at the winch, 1 arm raised), 轮渡 1 evading 100 px downstream (curved wake, blank bow wedge), 海事艇 1 with blank wake, 顶推船队 passing under span 8 | 桥 + 桥头堡 2 (7-tier 攒尖 pavilions, 150 px) | 龟山松 10, 岸杂 8 | 界画 oblique: Wuchang 堡 at (3300, 330) near bank, Hanyang 堡 at (2600, 205); deck rises 125 px leftward; **9 spans × 80 px**, truss 25–32 px high near end, 22 px far end, Warren diagonals every 12–14 px, three line weights (chords 0.9, verticals 0.7, diagonals 0.5), 18% members broken, far four spans fade to alpha 40% into mist; upper road deck with 栏杆 posts every 8 px, rail deck inside; stone piers with 分水尖, 引桥石拱 at both ends; **train 1** (7 cars, 40% visible behind the truss, head directly above the mast tip by 20 px), **bus 2**, **cars 0**, e-bikes 6; on the deck 20 lean over the rail looking down, 6 arms raised, a tour group of 15 with small flags scattered by one e-bike going the wrong way (原作桥顶轿马相争); 晴川阁 terrace 8 turned toward the bridge; 汉阳门 steps 6 pointing. All arms point at the same span. |
| S6 | 2560–2160 | 龟山·晴川阁·铁门关 | 42 | 小艇 1 | 晴川阁 (3 tiers on stone 台 at 2480, 190–300), 禹稷行宫 2 halls, 铁门关城台 + 楼 at (2330, 300–400) = 城门槽位, 牌坊, 配殿 3 | 松柏 14, 杂 8 | 电视塔 at x≈2540: 6 pale ink lines up to y≈40, no colour, the only modern vertical piercing the sky; river retreats to the upper band y 60–220 |
| S7 | 2160–1800 | 汉江·南岸嘴·龙王庙(两江交汇) | 34 | 汉江渡 1 (16 people + 5 e-bikes), 货驳 2, 拖轮 1, 小艇 1 | 龙王庙 + 牌坊, 集家嘴趸船, 防洪墙 | 芦苇 8 as grass, 柳 8, 杂 4 | 汉江 enters from the bottom edge (2100, 500) to (1900, 130), 100 px wide; 南岸嘴 grass point at (2050, 220); **清浊线**: from (1920, 140) drifting left 250 px, 长江 side 淡赭 ≤8%, 汉江 side 淡花青 ≤8%, soft wavering edge, silk showing, no outline — the only coloured water in the scroll |
| S8 | 1800–1350 | 集家嘴·汉正街 | ≈95 | 卸货驳 2, 趸船 1 | 28 shops in one 30° oblique, 3 rows to y 500; 里份 4 behind (灰瓦天井, 石库门, faded 朱砂春联 beside doors) | 梧桐 8 | river gone into the **upper-edge mist** after x≈1600 so the city takes the full height; 扁担 22 (bamboo pole + two woven-bag bundles = 原作脚夫), 三轮/板车 9, stall keepers 14, mahjong table 4 at a doorway, 幌子 「布」「百貨」「湯包」「熱乾麵」 as ink blobs, 2–3 readable boards |
| S9 | 1350–820 | 江汉关·武汉关码头·江汉路 | ≈100 | 轮渡 1 arriving (the one that left S2), 趸船 1, far 游船 1 | 江汉关 (3-step 台基, 8-column colonnade, 4 storeys of windows, clock tower ≈260 px, **clock face 20 px hands at 8:00**, 「江漢關」 16–20 px), 码头房, 闸口, 21 街面 (租界 arched windows, colonnades = 界画), 老通城豆皮, 蔡林记面摊, 叶开泰药铺 | 梧桐 12 | 广场舞 12 in a ring + 6 watching (原作说书围观圈); ferry landing 24; water only at the wharf, 300 px |
| S10 | 820–420 | 中山大道·里份(卷尾) | 32 | 0 | 8: 里份 with 石库门 and 天井, one 公交 stopped at a 站牌 (the second bus) | 4 | ends on a 里份 doorway cut in half by the picture edge (戛然而止) |
| S11 | 420–220 | 卷尾留白 | 0 | 0 | 0 | 0 | blank silk, seals |
| 拖尾 | 220–0 | 跋纸 | — | — | — | — | 行书 colophon, 2 seals |

Totals ≈ 640 figures, 20 boats, 120 buildings + bridge, 190 trees; vehicles: train 1, bus 2, cars 0, e-bikes ≈30, 三轮/板车 ≈14, bikes 4. Density per 100 px: S1 6 → S2 15 → S3 8 → S4 8 → **S5 21** → S6 10 → S7 9 → S8 21 → S9 19 → S10 8. The bridge must be the peak; if S8 exceeds it, cut S8 first.

## Rules that every module obeys
1. **Blank silk**: sky, road centres, wall faces, bowls, ferry upper cabins, 东湖 water, mid-river, mist. No stage paints there.
2. **Water lines** only within 40 px of hulls, piers and banks; clusters 4–9 strokes, 8–24 px long, 1.6–2.6 px apart, blank between clusters; wakes behind moving boats; 东湖 none.
3. **Pigment**: 赭石 wood/walls/ground/skin (ink 0.25–0.4); 花青 roofs/篷/one robe in three, water bands 0.08–0.15; 淡墨 under eaves and on trunks; 朱砂 ≤ 80 spots in the whole scroll (float balls, flags, 幌子 edges, 春联, 3 樱, 4 桃) — never on architecture faces. Colour always inside and lighter than the ink line. No cars painted; no glass; no LED; no wires; no fishing boats; 法桐 bare with seed balls; 柳 new green; 樱 late only.
4. **Landmarks** ≤ 25% of their station's width and always partly occluded by trees, people or mist; nothing but 黄鹤楼、江汉关、电视塔、桥头堡 rises above the 桥头堡.
5. **Signs**: at most 14 readable boards (楷, 12–20 px) in the whole scroll — 「戶部巷」「熱乾麵」「豆皮」「湯包」「蔡林記」「老通城」「四季美」「葉開泰」「江漢關」「集家嘴」「輪渡」「百貨」「布」「藥」; everything else is a 6–9 px ink blob with brush character.
6. **Figures**: 5–8 visible strokes at this scale; faces are one 淡赭 dot; identity from hat, garment length, bare legs, prop. Crowds are groups with a shared focus, never an even scatter. Front figures break the lines of figures behind (z-mask).
7. **Lines**: three grades — ruler line (0.6–0.9 px, alpha 170–210, slight overshoot at joints), 白描 (0.45–0.85, three-piece pressure), texture (0.35–0.55, alpha 60–120). Same stroke on unlike things is a tell.
8. **Randomness** resolved at build time; draw closures read captured values only.

## Colophon (拖尾, 行书, ≈ 75 chars, size 18, 14 per column, gap 24 — recompute columns against CW=220)
丙午清明後一日,以張擇端筆法寫武漢兩江。東湖春水,蛇山黃鶴,戶部巷過早,大橋走車行船,龜山晴川,漢水入江,漢正街扁擔,江漢關鐘聲。取其法,不取其景。
Seals below the last column: 「取法」「不取景」. Collector seals at the right end: 「珍藏」「審定」.

## Stage texts (page)
0 矾绢 · 1 起稿·地势 · 2 界画 · 3 舟船 · 4 树石 · 5 人物 · 6 水纹 · 7 淡设色·赭石 · 8 淡设色·花青·朱砂 · 9 复勾·招牌·题跋 — each with a paragraph in `core.js` naming the material and why it comes now (see style-source §2).
