# ALIGN Figure 1 — the loop draws itself

The method overview at the top of both READMEs, drawn by the loop it describes. A single
p5.js program lays 1800 × 1000 of ink on silk in six stages you can scrub — drawn entirely by code,
without an image-generation model. The one raster on the page is ALIGN's own
output: a strip of the 清明上河图·武汉 handscroll, itself program-drawn. Composition from
ARIS-Movie-Director's Figure 1 (title top left, three numbered bands, loops under them,
legend bottom-left); the visual identity — silk ground, 楷 headings, brush arrows with 起笔
and 收笔, the 朱砂 seal for the verdict, 白描 icons — is the user's ruling, not the source's.
Seven versions, five blind rounds by a Codex reviewer that saw the render and never the code.

`figure.png` and `figure.svg` are v7, the files the repo READMEs carry as `docs/figure1.*`.

## Layout

| path | what it is |
|---|---|
| `figure.html` | the runnable page — **open this one**; scrubs the six stages, exports the SVG |
| `p5.min.js`, `p5.svg.js`, `thumbs.js` | the page's three scripts; `thumbs.js` carries the showcase strip as a data URI, so `file://` and the SVG export see the same bytes |
| `thumbs/` | the source crops, including `showcase.jpg` (3040 × 291, the 武汉 scroll v11) that `thumbs.js` encodes; the rest are the twelve v1–v2 crops D-14 removed from the figure |
| `figure.png`, `figure.svg` | v7 at 1800 × 1000; the SVG keeps text as text and every stroke as one filled path |
| `iterations/` | `v1.png`…`v7.png` and `v1.svg`…`v7.svg`, plus compact JPEG previews |
| `wiki/` | `method.md` (what the figure must make a stranger say back), `reference.md` (the style source and the craft claim), `plan.md` (v7's geometry, palette, word list), `gates.md`, `decisions.md` (D-01–D-31), `review-log.md` (rounds 1–5, round 6, 收官) |
| `review/` | `round-1.md`…`round-5.md`, the five blind replies verbatim; `codex-skill-verdict.md`, `codex-skill-recheck.md`, `codex-skill-verify.md`, the three Codex readings of `skills/method-figure-loop/SKILL.md`; `codex-coldstart-painting.md`, a cold-start reading of the painting skill |

## Open it, scrub it

Open `figure.html` in Chrome or Edge — everything it needs sits beside it, nothing is fetched.
The six buttons are the construction order, each stage adding only what it names:

**色带** the frame, title strip and three tinted bands · **框** the ten panels and the seal ·
**箭头** the main ink flow, then the 赭石 repaint, the 花青 overrule, the 淡墨 audit, routed edge
to edge · **白描** the ink-line icons and the two actor glyphs · **文字** arrow labels, role tags,
the seal's three exit words · **图例** the legend, the rule panel, the showcase strip and its caption.

The slider scrubs continuously between them; `export SVG` writes the same mark list to an
`<svg>` as `ALIGN-figure1.svg`. Deep links:
`#p=0…1` progress · `#stage=1…6` jump to a stage · `#seq=1,0.35,1` replay a scrub sequence ·
`#svg` render the SVG inline. Fonts are local only — Kaiti SC for the 楷, Optima for the English,
Heiti for the seal's 白文; font substitution can change the layout; the PNGs preserve the original rendering.

Re-render the delivered file:

```
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new --disable-gpu \
  --hide-scrollbars --window-size=1800,1120 --virtual-time-budget=60000 --screenshot=figure.png \
  "file://$PWD/figure.html#p=1"
```

Crop the result to 1800 × 1000. Any Chromium works; swap the binary path.

## Trajectory

Every round is a fresh Codex thread, read-only, that sees the render at 1× plus 2× crops and —
from round 2 — the style source. It never sees the program. Scores are its own trajectory
number out of 10, a direction-finder and no part of the gate.

| version | round | score | what changed | what the reviewer said |
|---|---|---|---|---|
| v1 | B1 | 5 (no source) | first full render: white-box pipeline, twelve raster crops, a diamond verdict, a shield on the gate | 「The connectors describe a less complete method than the numbered bands imply.」 The diamond named two terms with no branches; the repaint reached Program but named two targets |
| v2 | B2 | 6 · baseline | repaint leaves the wiki, diamond names **accept · overrule · revert**, audit re-routed under the boxes, type back to the source's sizes | 「The diamond names outcomes without drawing their consequences.」 「The rule pair announces a judgment instead of making it visible.」 First landing pulled to the band-2 heading and the empty diamond |
| v3 | B3 | 5 | **the identity reset** — silk ground, 楷 headings, ink panels with 白描 icons, brush arrows, the 朱砂 seal, one showcase strip | 「The figure now carries an ink-and-scroll identity of its own … Those choices carry meaning.」 「V3's weaknesses are small explanatory drawings and visibly mechanical stroke construction.」 The one item marked *worse* was the rule panel, whose pictures went with the user's ruling |
| v4 | B4 | 6 | full name and *without diffusion* in the title; every arrow, head and dash one filled polygon (2750 pieces → 508 paths); audit to 2 px; ✗ → ✓ pairs; band 3 to 190 px | 「different blue dash lengths share essentially the same pointed contour. The roughly 160 px seal-to-wiki shaft remains nearly a uniform rail.」 「the identity costs legibility where pale internal strokes describe tiny scenery or document contents」 |
| v5 | B5 | 7 | 「✓ reviewer · ✓ user → stop」; the 规格 booklet among the module motifs; source keeps the mountain, the work keeps the bridge; directional dashes; the eye at 52 × 34, opaque, the flow passing through it | 「The ink-and-scroll identity is now clear … cinnabar makes judgment salient.」 The stop read plainly first try. Beauty (asked first time): 「好看 … 不好看的是视觉分量分配:细致的审图动作缩在小框里,右下的大口号却很抢眼,显得板、重。」 |
| v6 | — | — | D-31's closing list: role tags `executor · Claude` / `reviewer · Codex` / `user`; the seal's three exits each with a word and a destination; **one version per round** into 版本; the stop line made the main sentence; the eleven-square version row | **no blind thread read it.** The executor applied the list and looked at its own render — same model, same session, nothing withheld |
| v7 | — | — | v6 with the title strip renamed `ALIGN : Agentic Loop Image GeneratioN`; the renders differ only in y 23–68 | **unread.** This is the file under both READMEs' H1 |

## The identity reset after v2

The user saw `iterations/v2.png` between round 2 and round 3 and ruled (**D-14**):

> 「不要这么多截图,只要最下面有一个展示的图;框里示意就行;偏古风会好一点;这个 pipeline 太丑了。」

That outranked the reviewer's whole round-2 list and rewrote the craft claim in `reference.md`.
v2's pastel bands, white rounded boxes, twelve raster crops, diamond and shield were reverted
and not built on. What replaced them: the 武汉 scroll's oxidised silk lightened to a page tone
(#d9cbb0), bands one tint deeper (#cdbc9c), ink-outlined paper panels (#ece2cc) with an
eave-like head rule, five colours by role only (ink · 赭石 · 花青 · 朱砂 · 石绿), 楷 headings over
a humanist sans, brush arrows ported from `qingming-wuhan/src/core.js`'s stroke profile, the
verdict as a carved 朱砂 seal, one 白描 icon per panel drawn by the program, and exactly one
raster — the showcase strip at the bottom.

Three rounds later the reviewer wrote that identity back at us unprompted, so the reset held.
The user added the second half of the gate at v4 (**D-30**): 「美观是门的一半」 — from round 5 the
prompt asks 「作为一张放在 README 顶部的图,它好看吗?哪里不好看,一处最有效的改法。」

## The three relationships that stayed unread

Five readings never recovered these, and each carries a written reason rather than another redraw:

1. **The handoff into band 2** — how the specification assigns modules, who owns which. `unclear`
   in all five readings. D-23 (a) bought the 规格 booklet among the four motifs and it did not
   clear. Closed: `method.md` names roles and a contract, not an assignment procedure.
2. **The three outcomes' different consequences** — `unclear` rounds 2–5. D-10's answer is that
   accept, overrule and revert are all written into the wiki, one destination, because that is
   what the method does; the source branches because its outcomes go to different places.
   v6 finally gave each exit a word and a destination anyway. **Unread.**
3. **The connector into band 3** — when the loop yields its outputs. `unclear` in all five
   readings, closed under D-03 (the source carries no main-flow arrow between bands; the numbers
   carry the sequence), then overtaken by v6, which draws revert and **one version per round**
   into 版本. **Unread.**

The two readings that never cleared are exactly the two the last redraw addressed, and the last
redraw is the one nobody read.

## Where the run stands

**Seven versions, five blind rounds.** The blind trajectory is 5 without the composition source,
then 6 · 5 · 6 · 7. **v6 and v7 were the executor's own redraw and self-look, with no blind
thread** — same model, same session, nothing withheld from it, so that reading carries none of
the weight of rounds 1–5. **The last independent reading is v5's 7/10. The gate was not passed** —
round 5 still marked three sentences `unclear`, and the blind pass is the reviewer's to give.
**The figure now in the repo README has not been read by any reviewer.**

If the run resumes: one blind round on v7 (fresh thread, another model family, the whole figure
at 900 plus two 2× crops recut from v7, no process sheet — the stage order is unchanged); ask
what v6 spent its words on, since the three exit words, two role tags, **one version per round**
and **every version kept** were bought by cutting the rule panel's ✗ → ✓ example lines; watch
whether the rule panel takes the third landing again, now that D-31 (4) gave bold 28 back to the
stop line D-27 had just taken bold away from. Then the user's look, and the handoff.
