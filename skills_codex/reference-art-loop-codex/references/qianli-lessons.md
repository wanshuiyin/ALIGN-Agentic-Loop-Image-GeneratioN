# Lessons from the original Qianli implementation

This is a condensed account of the earlier `examples/qianli-process/` run
preserved in the source skill. It is not evidence that a new Codex-only
version has been reviewed. New work must keep its own images and reviews.
The historical values came from a 4270 × 500 interpretation and need new
measurement at a different size or against a different reproduction.

## Start with the reference in every blind packet

The old run used two source rounds and then visual rounds. B1–B6 did not
show the fixed reproduction to the reviewer. The recorded score rose to
5.8 in B6, then fell to 4.0 in B7 when the reference and stage sheet were
finally supplied. That fall was a change in the comparison target, not
proof that the new painting had become worse. B7 and B8 diagnosed weak
interlocking anatomy and one-scale digital mottling. Give the reference
from the first round, keep it fixed, and do not inherit old scores.

## Form before added noise

Triangle-plus-noise mountains remained tents. Replacing the ridge with
ledges, notches, shoulders and asymmetrical peaks improved silhouettes, but
the later review still saw separate scenery pieces on a common shoreline
and long flanks without changes of plane. Merely thickening contours and
adding more texture did not join their anatomy.

The next proposed primitive was interlocking rock masses, each with broken
outline, ledges, lit/shaded faces and form-directed 皴. That proposal was
not a proven solution in the old run. Test it in a representative passage
against the fixed reference, then let the new visual response decide.

## Pigment needs material structure

Horizontal color bands kept reading as scanlines despite alpha tuning.
Dab accumulation removed that tell in the historical reviews. But a denser
azurite core later read as sponge spray, and a common small noise scale
across all colors read as digital mottling. Different pigment layers need
deposits that follow the local faces, differing coverage and suitable edge
behavior; avoid merely changing the seed of one universal texture.

One useful overlap calibration was `a = 1 - (1 - ink)^(1 / overlap)` for
overlapping translucent dabs. This is a way to reason about coverage, not
a universal recipe. The old implementation clamped dab radius near the
outline to keep pigment within the drawing. Opaque mineral deposits should
not be made translucent simply because a reviewer expects generic ink wash.

## Texture, water, lettering and ground

- **Ink and 皴:** coherent broken contour chunks worked better than
  pointwise dotted debris. Texture must grow from local relief and connect
  to the ink skeleton. Old stroke counts and spacing did not establish a
  solved texture recipe.
- **Water:** at the old viewing scale, fine patterns could read as tonal
  texture. Repeated chunk endpoints doubled dark joints; inconsistent row
  spacing produced bands. Later reference-based review still preferred much
  quieter water. Measure the new reproduction and display scale instead of
  inheriting either a universal full-coverage rule or a fixed erasure ratio.
- **Lettering:** brush load, pressure, taper and dry brush mattered more
  than distorting glyphs. The user's response to warped skeletons was that
  the characters looked crooked. Excess tilt and column wandering were
  reduced. Font-based skeletons improved the category without proving
  faithful calligraphy, and a local-only font invalidated assumptions about
  how other machines displayed it. If lettering matters, inspect its actual
  delivered face and keep user feedback in the visual decision process.
- **Ground:** broad translucent polygons read as low-poly camouflage.
  Subtle grain and fibers removed that dominant complaint in later reviews,
  but their precise numerical settings were not separately validated.
- **Inscription placement:** a display title added inside the painting was
  removed because it was absent from the fixed reproduction. A colophon
  belongs where that reference actually shows it; do not add text merely
  to make the page seem historical.

The transferable lesson is to diagnose material and anatomy at delivery
scale, change primitives when tuning stops helping, and let the next fresh
review judge the actual image. A historical attempted remedy is not a pass.

## Historical calibration, only when its mechanism applies

Consult these details when the new image shows the same failure. They
preserve useful craft experiments from the original skill; they are not
parameters to import into a fresh implementation. All pixel values below
belong to the earlier 4270 × 500 run and its particular scaling.

**Ridge and face experiments.** One old replacement walked crests in
15–45 px segments with ledges and notches, secondary peaks and spurs that
divided the flank into faces. Later experiments added 10–24 px stepped caps,
off-center summits and 60–120 px shoulders. These changes weakened the tent
silhouette but did not clear the later structural verdict. Shared geometry
did help: contour, color, texture and occlusion all read the same ridge.
The lesson is coordination of mark families, not a randomized crest recipe.

**Dab coverage.** The original scanline replacement used radial-gradient
dabs on a jittered 3–5 px grid and kept radius below roughly 0.9 times the
distance to the outline. With expected overlap `π r² / step²`, per-dab alpha
was derived from the desired accumulated opacity using the formula above.
Its selected azurite deposits removed a uniform cobalt-rim complaint by B4;
a later dense core was rejected as sponge spray. A 2-D noise frequency near
0.028 per old output pixel had produced camouflage speckle, illustrating
why simply increasing spatial variation can make material appearance worse.
Neither these values nor the later 25–80 px downhill washes were a proven
solution to B7–B8's broader pigment-anatomy issue.

**Ink continuity.** D-09 tried outlines in 32–60 px chunks at 0.7–1.5 px
width, omitted whole chunks, then restated thinner accents over color.
Texture bundles ran roughly along the local downhill and were denser on
shaded faces. Per-point breaking had looked like dotted debris. B3 still
judged the texture poorly, so the experiment supports coherent breaks and
form direction, not a claim that its widths or bundle counts passed.

**Water scale.** At approximately 1 mm per output pixel, an old trial used
rows 1.7–2.6 px apart, alpha 13–27, wavelengths 24–40 px, amplitude below
40% of row spacing, phase offsets between neighbors and slight bends near
land. B6 accepted the resulting texture at its viewing scale. Sharing two
endpoints between adjacent chunks drew dark joints twice. Varying row spacing
independently over 0.8–1.35 times the nominal value produced density bands.
Those mechanisms are useful diagnostics; the later fixed-reference review
still favored quieter water, so remeasure before choosing coverage.

**Letter skeletons and brush behavior.** When actual brush paths are
unavailable, the old experiment rasterized each glyph at 6×, estimated
distance to its edge, identified connected components and redeposited ink
as overlapping dabs. Width modulation, taper toward the end of the dominant
stroke direction, per-character ink budgets and sparse parallel bristle
gaps could affect brush appearance. Independent pinholes instead read as
distressed type. These are approximation techniques: connected components
do not recover the historical stroke order, and a font skeleton does not
automatically become authentic calligraphy.

The old experiment used roughly 5.5 dab overlaps, up to 7–9 for display
characters, and radius near 0.86 times edge distance. Ink decay per dab dried
large glyphs halfway through; budgeting load per character worked better.
Yet B4 still saw an outlined display glyph and even colophon rhythm. The
user rejected the added skeleton warp, tilt and wandering layout. Those
deformations were reduced substantially while pressure and ink behavior
stayed. Test a short actual text passage in the delivered font before
building an entire colophon, and use user feedback when it arrives without
turning that feedback into a mandatory permission pause.

**Support texture.** The old replacement for broad polygonal stains used
fine grain, subtle warp/weft fibers and sparse low-opacity larger stains.
Later reviewers stopped ranking the support as dominant, but no isolated
experiment established the precise values as causal. At normal scale,
support should not compete with the painting or repeat an obvious low-poly
pattern.

## Evidence from the separate Codex from-scratch run

The 13-version Codex run used new painting and player code, a fixed reference,
fresh image-only reviewers and a runnable HTML per version. It completed its
chosen round budget without a blind visual pass. Treat the following as
observed failure modes and verified execution lessons, not an approved recipe.

- Closed washes removed the first draft's empty wedges, but then read as
  continuous blue collars. Breaking the washes into grainy patches reduced
  geometric cut faces without establishing mineral thickness. A different
  texture generator cannot repair an unresolved underlying rock face.
- Attaching small rocks to a large parent introduced horizontal cut shelves.
  Extending them downward initially created vertical tabs. Inspect the
  attachment, silhouette and foot of a single shoulder before propagating
  it; an increased rock count is not evidence of better anatomy.
- The large continuous pale island base became less dominant only after it
  was replaced by local banks and water openings. A later mountain terrace
  helped the path-and-village connection, but did not solve the main peak's
  planar appearance. Preserve resolved relationships while targeting the
  remaining large form.
- A water wash drawn in 2-pixel rows with 2.1-pixel fill height introduced
  repeated overlap stripes. A half-finished material can therefore reveal
  a compositing issue as well as a brush-design issue. Inspect that stage
  before adding more surface noise or wave marks.
- A bundled CJK font subset displayed the colophon correctly while leaving
  process-sheet digits as missing-glyph boxes. Inspect all actual label
  strings, including numerals and punctuation; use an appropriate second
  font where coverage differs. Small layout and ink changes retained
  legibility but did not make the colophon equivalent to written calligraphy.
- Separate offline browser contexts reopened the first, middle and final
  HTML, reproduced each saved image and exercised the real progress input.
  PNG replay required zero changed pixels. For WebM, the checker decoded
  actual VP9 frames in order and compared the first, last and final-stage
  change region; a nonempty blob or a video element's seek result was not
  sufficient evidence. Lossy video needs a documented image-quality
  comparison, not the PNG zero-difference threshold.

The final reviewers still saw planar large mountains, granular color patches
and repeated fine contour texture at normal scale. A useful continuation
would rebuild one complete peak—contour, convex shoulder, recessed fold,
pigment and foot—as a representative passage, then review it before
replacing the other mountains. Do not turn this unfinished result into a
passed preset simply because all 13 executable versions were retained.
