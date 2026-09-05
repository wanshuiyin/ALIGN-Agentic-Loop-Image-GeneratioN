# Gates — ALIGN Figure 1

A loop can DRIVE, cannot ACQUIT: the one mechanical check below passing every round proves nothing about the figure; only the blind reviewer's explanation, and then the user's look, end the run.

## G-01 · Replay determinism (the one mechanical gate)

Render the figure at full progress directly (`figure.html#p=1`) and again after the page has scrubbed backward and returned to full progress through its own controls (`figure.html#seq=1,0.35,1` — play to the end, scrub back to a third, return to the end; the same widget the user drags). Diff the two 1800 × 1000 PNGs with PIL (`ImageChops.difference`, count non-zero pixels). Expected: **0 differing pixels**. Any repeatable difference means a draw-time choice leaked into replay — an arrow routed in `draw()`, a thumbnail scaled from a size read at draw time, a label measured after a font swap — and the fix is to move that choice to build time. Result noted per round in `review-log.md`.

## Hygiene, not gates (done before every blind round, never scored)

- The exported SVG (`#p=1&svg`) opened beside `whole.png`: a dropped thumbnail, a label in the wrong face, a stroke scaled wrong, a dash pattern lost.
- No console exception at full progress; playback and scrubbing react promptly.
- The integrator's first look, from `plan.md`'s rules: every word on the list and none off it; three sizes; arrows end on box edges; no label rides a stroke; no head under a box; the blank list untouched; band heights differ; nothing in the figure that the source does not carry (shadow, gradient, glow); fallback glyphs in 千里江山图 / 清明上河图·武汉 / 取其法,不取其景 / → / |.

A domain check is added here only after a concrete failure names it (an arrow head that ended under a box earns "every head lands on an edge" that round). None pre-written.

## The blind questions

**Round 1** (no style source in sight): explain the method back from the figure alone, 5–8 sentences in reading order, `unclear:` before any sentence where the figure left the reader unsure; the template-made tells ranked by how much they hurt the craft claim, each with the single change that helps most; the process sheet's plausibility (does each panel add only what its stage names — 色带 · 框 · 箭头 · 缩略图 · 文字 · 图例); what already holds and should constrain later redrawing; a 0–10 for "a reader explains the method correctly from this figure alone".

**Round ≥ 2** (style windows beside the work, craft only — 风格迁移: it shows a different method; never compare content): the previous round's unresolved observations quoted verbatim and for each — still material / visible but no longer dominant / gone / worse — with one line of evidence; the explanation again, so a fix is seen to land in the reading; for each remaining tell, parameter of the present construction or a different construction; the passages that now hold and what must not be undone there; what other tell is now material; the craft comparison (band grammar, box families, arrow kinds by meaning, type sizes, word count, where the eye lands first — which conventions kept, which broken, does each break help or hurt). Numbers only where the image gives a reliable scale: `whole.png` is 1800 × 1000 at 1×; `dense.png` and `bottom.png` are 2×.

**Question 8**, only when the user names a whole-figure quality: the measurement against the source (the source carries ≈ 140 words in three sizes plus the title's; the work 70 in the same; the source's four arrow weights 5 / 3 / 3-dashed / 1.5 against the work's), and the designer's prescription.

## Pass criteria (verbatim from the skill)

- *Blind pass:* "From the figure alone, the reviewer's explanation returns every move in `method.md` in order and every fact, with no `unclear`; at reading size, beside the style source, the reviewer judges the work plausibly CRAFT_CLAIM and names no remaining template-made tell material enough to warrant another redraw; every residual observation has a written reason not to pursue it."
- *Human pass:* the user accepts the rendered figure after handoff; every element they named is on it where they wanted it.

CRAFT_CLAIM is the sentence at the top of `reference.md`. A directional 0–10 may be recorded per round to read a trajectory; it is part of neither pass, and the trajectory restarts if the reviewer model changes. Round 1's number, given without the style source, is not comparable to round 2's.

## Reviewer

Codex through `mcp__codex__codex`, model and effort from `~/.codex/config.toml`, sandbox read-only, fresh thread per round, calls strictly serial; the prompt names only image paths and carries the Phase 4 scope block verbatim. If no such reviewer is available, no round is called blind-reviewed.

## Round budget

8 blind rounds by default; a round is triggered by a change in the figure, never by the clock. Stop at the blind pass, at the budget, or when the user says so; then the handoff.
