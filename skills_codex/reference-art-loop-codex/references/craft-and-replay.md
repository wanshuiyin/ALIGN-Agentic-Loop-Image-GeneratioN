# Craft study and replay implementation

Read when establishing a new medium or replacing a major mark primitive.

## Study the particular reproduction

Fix a usable image, not just an artwork title. Record its source, edition or
impression where relevant, crop, aspect and intended display size. Different
reproductions can differ in color and crop. Use the supplied local reference
when one is available; otherwise obtain a suitable reproduction and cite its
source. Open it. Do not substitute a remembered style for the actual target.

When physical dimensions and faithful scaling are known, calculate physical
size per output pixel. Otherwise map representative source marks into the
output dimensions. Non-uniform compression needs an explicit note. Identify
marks that become unresolved at normal viewing size: their aggregate tonal
effect matters more than individually legible lines. An enlargement is a
diagnostic view, not a mandate to exaggerate small marks.

Record the major masses and intervals, dense versus quiet areas, high and
low passages, overlaps, visual route and scale of figures or buildings.
Preserve intentional negative space. If the format changes, state which
movements are cropped, compressed or combined.

Record the mark vocabulary: each family's depicted material, normal scale,
density, direction relative to form, opacity, edge and beginning/ending
behavior. Tree species and near/far foliage may need different grammars;
one generic symbol with random sizes is rarely a sufficient vocabulary.
Contours, shaded planes and texture strokes need the same underlying form.

Check actual title, colophon and seal positions in the reproduction. Keep
interface headings outside the artwork unless the reference carries them.
If writing cannot be faithfully reproduced at the chosen scale, make a
deliberate visual choice and record it; invented pseudo-calligraphy is not
evidence of historical accuracy.

## Reconstruct the sequence honestly

Find sources for the medium's working order when it is not supplied. The
precise historical brush sequence is often undocumented. Distinguish a
documented material order from a conventional reconstruction and from a
presentation choice. Never universalize a single example's ten stages.

For 青绿山水, possible study headings include substrate preparation, ink
outlining and texture, ochre groundwork, green washes, mineral green and
azurite deposits, details and final ink accents. Whether water, distant
mountains or clouds are reserved or added depends on the chosen reference
and reconstruction. Material names should match what each stage adds.

Other media have different units: registered color impressions for a
woodblock print, drawing and glazing passes for oil, paths and fills for
SVG. A scroll's reading direction does not establish the painter's literal
stroke chronology. A directional playback may be useful, but label it as
the chosen reconstruction when historical evidence does not establish it.

If an existing example supplies a useful technique and reuse fits the user's
request, document what was borrowed and why. Adapt that technique to the new
reference instead of copying an unrelated composition or claiming its old
reviews for this run. If the user requests a fresh implementation, keep old
artwork implementation code out of the new one; lessons are not permission
to continue the prior generator.

## Store actions, then draw them

Build ordered actions at a granularity appropriate to the material: strokes,
dabs, fills, impressions. Each action stores stage, position, size, color,
opacity, jitter and any local geometry that affects its appearance. Choose
randomness and composition during construction. Replaying an action should
only consume stable data and update the surface.

Let coherent surfaces share geometry. If a ridge changes, the contour,
pigment clipping, local plane direction and texture should change together.
When the picture keeps looking assembled after a coherent parameter edit,
replace the form representation before accumulating further noise.

Reserve bare support where appropriate. Let later opaque layers cover
earlier ones where the medium does. Use generation masks when marks are
actually excluded or a translucent approximation would expose an earlier
layer the reference hides. Record such approximations in the plan. Do not
mask a structural drawing error just to silence one screenshot observation.

An unchanging support may be baked once if its preparation is outside the
promised process. If sizing, tinting or grounding is shown as a stage, its
material change should actually appear during that stage.

## Presentation and capture

Show a sheet or panel at an appropriate whole-work scale. For a long scroll,
an offscreen full surface, movable viewport and minimap make both local
detail and composition inspectable. A drawing cursor is optional; it should
follow actual replay work if shown. Pace stages according to their visible
work instead of dividing time equally between unrelated actions.

Expose play/pause, progress and stage selection. Deep links such as
`#p=…&cam=…` are useful when the implementation naturally supports them,
but are not a required API. Browser automation may use public controls or
a documented replay interface. Add stage snapshots for backward scrubbing
when measured stalls make them useful, preserving pixel-equivalent replay.

Use an installed browser and existing project tooling. A small reusable
capture helper is appropriate for a real multi-round run; it should drive
the same implementation users see, wait for readiness, and save stable
views. Avoid separate screenshot-only drawing code. Use local HTTP for
asset-dependent pages, `file://` only for self-contained files that actually
work that way. Do not hardcode one author's application path as a dependency.

For browser fonts, load the complete final string in the selected face,
for example `document.fonts.load(font, fullText)`, then inspect the rendered
glyphs. CJK web fonts may load subsets according to the string requested.
Use a font available in both the capture environment and deliverable, or a
visually acceptable declared fallback; test the delivered choice. Optional
recording should use capabilities available in the actual host.

Render the process sheet from real stage progress. For each stage select a
crop that changes materially, with readable before/after labels outside the
artwork. Different stages can require different fixed crops. Include enough
context to judge what changed; oversized contact sheets that reduce marks
to unreadable thumbnails do not establish material plausibility.

## What the checks prove

Pixel comparison after direct completion versus backward/forward scrubbing
tests replay determinism. It does not test resemblance, historical accuracy
or a plausible stage order. A visually pleasing final image does not prove
that its making sequence is truthful. Independent image review covers
visible resemblance and process plausibility; controls must also be exercised
to assess replay behavior. Keep those conclusions distinct in the log.

Add narrowly useful checks for observed failures, such as a floating bridge
or repeated water joints, when the check would change the next action. Do
not replace aesthetic judgement with generic scores or a large test suite.
