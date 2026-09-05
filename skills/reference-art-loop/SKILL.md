---
name: reference-art-loop
description: ALIGN — Agentic Loop Image GeneratioN. Paint a subject in the craft of a reference artwork as executable p5.js, Canvas, SVG or another mark-based medium, replay that craft's real order of work, and improve it through pixel-only cross-model review. The reference fixes the craft; the subject may be the reference's own scene (千里江山图 → p5.js) or another (清明上河图 → 武汉). Not for one-shot raster image generation.
argument-hint: "[style source] → [subject] → [medium], e.g. 「清明上河图 → 武汉 → p5.js 手卷」"
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep, WebFetch, Skill, Artifact, mcp__codex__codex, mcp__codex__codex-reply
---

# Reference Art Loop (ALIGN) — a picture that makes itself, judged blind

> 🔒 Do not wrap this skill in `/loop`, `/schedule` or a cron. It loops internally
> (render → blind review → decide → repaint), and a round is triggered by a change
> in the picture, not by the clock.

The tool names in the front matter describe capabilities, not a portable
interface: use this host's equivalent shell, file, fetching, review and
presentation tools throughout.

You are given a style source — a reference artwork — a subject, and a medium
the result must be *written in*: p5.js in a browser, plain Canvas, SVG, a
plotter path list — anything where a picture is a sequence of making actions a
program lays down. The reference fixes a craft: its order of work, mark
vocabulary, colouring, blank rules and rhythm. The subject may be the
reference's own scene or anything else — 张择端's craft applied to present-day
武汉. You produce a page or file that replays the making of the picture in the
order the craft proceeds, and you keep improving it until a reviewer who sees
only rendered pixels — and fixed windows cut from the reference at viewing
size — judges the work a product of that craft and names no computer-origin
tell worth another round; then you put it in front of the user, whose
acceptance is the last gate.

Two modes, both legitimate. **意临** — the subject is the reference's own
scene (《千里江山图》 → p5.js): the style windows then also fix what the
passages look like, and the reviewer may hold a mountain against the mountain
it stands for. **风格迁移** — the craft from the reference, a new subject
(《清明上河图》 → 武汉): 取其法,不取其景, and nothing in the loop judges
resemblance to the original picture, only whether the work reads as a product
of that craft and whether the subject can be named from the picture alone. The
second is the more interesting one and the one this skill leads with; the first
is not deprecated.

This is the ARIS loop (plan · draft · adversarial review · iterate · persist)
applied to a picture. Three things are specific to pictures and are why this is
not `/auto-review-loop`:

- **The reviewer is blind to the code.** A model that reads the generator
  reviews the algorithm; a model that sees only renders reviews the picture. A
  vision-capable reviewer can open local images: give it paths and tell it to
  use its own image tool. It sees the style windows too — that is visual input,
  not source.
- **The style windows decide craft disagreements; the craft source decides
  process disagreements; the user decides the subject.** A reviewer applies
  general taste; the reproduction you fixed in Phase 0 has one specific
  appearance, and the tradition's documented sequence has one specific order.
  In the 武汉 run the reviewer said the river needed no water texture; the
  reference's 汴河 is lined edge to edge, and the reference won (D-19). When
  the exact work's order is undocumented, choose the best-supported
  conventional sequence for that tradition, state the reconstruction once in
  `reference.md`, and use it consistently. Every decision against the reviewer
  is written down, once.
- **Primitives beat parameters, once the parameter reached the marks.** When a
  coherent parameter change leaves a visible tell materially unchanged, first
  establish that the changed code affects the marks in question — a dead edit
  and a wrong primitive look identical from outside. Then replace the primitive
  when its construction is what prevents the required result. The reviewer's
  parameter-or-primitive call is a hypothesis about code it cannot see; weigh it
  against what the code does.

Everything you and the reviewer propose is bounded by
[HERO](https://github.com/wanshuiyin/HERO-Anti-OverDefense): no hashes, no
defensive scaffolding, no corner-case obsession, no rubric where judgement is
called for, no stalling. An art tool, a cooperating operator, their own machine.
The scope block in Phase 4 travels verbatim in every reviewer prompt.

## Context: $ARGUMENTS

## Constants

- **REVIEWER** — whatever separate, vision-capable model the operator has that
  can open the local renders, called through the interface this host actually
  exposes; name the model in `wiki/review-log.md`. Each round starts a fresh
  review context carrying no memory of earlier rounds — a follow-up may continue
  the same context inside one round — and calls are serial. The
  `mcp__codex__codex` / `codex-reply` block in Phase 4 is one installation's
  interface (model and effort from that operator's `~/.codex/config.toml`), not
  a requirement: send the same prompt through whatever reviewer is here. Your
  own look never substitutes. With no separate reviewer available, say so before
  the first blind round, finish the work, and hand over the runnable draft
  explicitly as unreviewed. A change of reviewer model starts a new score
  baseline.
- **ROUND_BUDGET** — from the invocation; default 8 blind rounds when none is
  given. The reference runs completed eleven and nine; data points, not limits.
- **CRAFT_CLAIM** — fixed in Phase 0: the material process the result should
  appear to come from ("mineral colour on silk", "绢本淡设色工笔界画",
  "registered woodblocks on paper"). The reviewer judges against this claim,
  never against "hand-painted" in general and never against the original's
  scene.
- **SUBJECT** — what the picture is of: the reference's own scene, or another
  the user names. For a transfer, use the user's focal passages when supplied;
  otherwise choose and state them from current subject research, and continue.
- **STYLE_WINDOWS** — the exact reproduction fixed in Phase 0 plus three to
  five windows cut from it at the intended viewing size (materially different
  passages) and one or two 2.5× details of the dominant mark-making. Cut once;
  every round's prompt names them.
- **PROJECT_DIR** — the path or existing project the user supplied; otherwise a
  short obvious `./<slug>/`. It holds the deliverable, `wiki/` and the working
  review renders; add `src/` only when the implementation actually has separate
  source parts.
- **VIEWS** — chosen once in Phase 1 from the composition, covering every focal
  passage; the same crops and scales every round so rounds compare.

Override in the invocation: `/reference-art-loop "北斋 神奈川沖浪裏 → 東京 → SVG"
— rounds: 4`.

## Doctrine

Blind review judges pixels against the craft, with the style windows beside
them — not source, not the original's scene. The windows decide what the
craft's marks look like; the craft source decides in what order they were
made; the user names the subject, and where they have not named its focal
passages you choose and state them; each decision is written once. Every
choice a mark needs is made when the mark is built, never when it is drawn, so
replay is exact. A failure that outlives a parameter change which demonstrably
reached the marks is a primitive problem; a primitive change the reviewer calls
a regression goes back to the previous version unless a stated craft or subject
correction requires the new one. An automatic check exists only if you
can name the failure it detects and what you would do differently. A loop can
drive itself; only the reviewer, and then the user, can acquit.

## Phase 0 — Fix the style source and study it

**Fix the image first.** Open the exact reproduction you will follow, keep a
local copy, and record in `wiki/reference.md`: its source, the edition or
impression when that matters (impressions of a print differ materially in
colour; the 清院本 of 清明上河图 is two orders of magnitude more saturated than
张择端's silk), the crop or omitted sections, the output aspect you will use,
and the intended viewing size. Cut the STYLE_WINDOWS from it now. Every later
measurement and every disagreement with the reviewer refers to this one image
at this one size. Enlargements diagnose mark-making; they do not set the
finish standard.

**Establish scale.** When physical dimensions are known and you keep the
work's height without non-uniform compression, compute millimetres per output
pixel. Otherwise measure a few representative marks in the source image and
map them into your output. Record any crop or compression that changes the
mapping. List the marks that are not individually resolved at the intended
view; their aggregate effect is what you paint, as texture — individual stroke
or vector geometry may still be the means that produces it. This one number
settled a two-round argument in the 千里 run: water lines 1–2 mm apart on a
51.5 cm scroll are 1–2 px at 500 px, a tonal texture and not lines. At
1 px ≈ 0.5 mm a face is one ochre dot and 瓦垄 are a directional grey texture.

**Write the order of work.** The stages documented or visibly supported for
this craft, each named with its material or tool. For 青绿山水: 矾绢 → 勾勒 →
皴擦 → 赭石打底 → 汁绿罩染 → 石绿 → 石青 → 水纹·远山 → 复勾·点景 → 云气·题跋. For
北宋界画风俗卷: 矾绢 → 起稿·地势 → 界画 → 舟船 → 树石 → 人物 → 水纹 → 赭石 →
花青·朱砂 → 复勾·招牌·题跋. A layered oil may use ground, underdrawing, dead
colour, glazes and impasto; a multiblock print uses its key and colour
impressions in the best-supported registration order. These are examples, not
required lists. Each stage is something the user can scrub to, and a stage that
adds something other than its named material is a lie the page tells.

**Write the mark vocabulary.** Describe each materially distinct mark family
that affects the craft claim: what it depicts, its scale and density at your
view, its direction relative to form, how it begins and ends (pools, tapers,
lifts, prints flat). Repeated motifs usually need the distinct grammars visible
in the reference rather than one reusable symbol generator; texture strokes
that radiate down from a peak and thicken on the shaded side are a different
primitive from strokes that follow contours. Where the craft has several line
characters (a ruler line, a pressured 白描 line, a texture line), name each —
the same stroke on unlike materials was a tell in every 武汉 round until the
grades were separated.

**Write what the original leaves alone.** Reserved silk as mist, unpainted
water, blank paper for a waterfall, the bare paper of a print's lights. These
are decisions in the craft and the cheapest wins in the work: make sure every
later pass leaves them. Check each blank against the windows, not against
taste — the 武汉 plan reserved the mid-river as a reconstruction, and the
reference's river is fully lined (D-19).

**Text and seals.** Separate three different things: the artist's own
inscription, the mounting title, and later colophons and collectors' seals. A
Yuan literati scroll carries the painter's inscription, signature and date
inside the picture as part of it; a Northern Song handscroll carries none — its
title is a later label and its colophon sits on a separate sheet after the
painting. Record which of the three this reference has, where each sits, at what
size and in what script. Take any new inscription's placement, script and scale
from the chosen work; a display caption dropped into a picture whose tradition
puts none there is the first tell a connoisseur names.

**Composition.** Measure the chosen reference's own sequence of masses, pauses
and transitions along its length, as fractions of that length: how many masses,
where the eye rests, the ratio of dense to empty, where the density peaks, where
the work breathes. For the reference's own scene: if the aspect cannot be kept,
preserve its major masses, pauses and transitions deliberately and record which
movements you kept or merged. For a subject transfer: the rhythm comes from
those measured relationships, the masses from the subject. (The 武汉 run measured
three sections at 19/38/43% of the length with the crowd's peak at the bridge —
that reference's proportions, that run's, not a template.)

**For a subject transfer, research the present subject before composing.**
Everything above studies the old picture and says nothing about what the new one
is of. Fix the focal passages first: take the ones the user named, and when they
named only a region, a city or a river, choose three to six yourself — the
passages that carry the place's identity, distributed the way the format
distributes attention: along its length for a scroll, around one view for a
single sheet — state them and why in `plan.md`, and continue without waiting
for the user.
Then study each: a current map for how the passages sit relative to one another
(which bank, upstream or downstream, what stands across from what, what is
visible from where), and dated views for present form — profiles, structures,
surfaces, vegetation, vehicles, signage, what people are doing and in what.
Record in `plan.md` the relationships and identifying features the drawing must
keep, and separately what you deliberately drop. Anything not grounded in that
record is invented scenery, and no one will name a generic riverscape.

**Then write the specification, before any code.** The 武汉 run drafted three
compositions and had three judges rank them — a local, a Song-painting
connoisseur, the programmer who must draw it at 1 px ≈ 0.5 mm — grafting an
element only when two agreed (D-02). The winner became `wiki/plan.md`: stations
in reading order with x ranges; counts of figures, vessels, buildings and trees
per station; the peak and the breathing spaces; the rules every module obeys —
the blank list, where texture may appear, the pigment budgets, the readable-text
cap, the line grades, randomness resolved at build time — each rule chosen for
this subject and this composition rather than carried in from another run; the
inscription text, if the reference's tradition carries one. Beside it
`wiki/interfaces.md` is the module contract: the shared context object, the
primitives a module may call, what its build returns, the occlusion rule. Each
focal passage gets a fixed view in Phase 1. Recognisability is the user's to
judge (D-18).

**Borrowed technique.** If the user hands you a file that already does one
thing well (a 墨虾 page whose ink is dab-accumulated along a path with
radial-gradient bleed; the previous scroll's brush-text engine and dab
formula), read it and write a `## Borrowed` section naming the idea you take.
Take the idea, not the file.

Then set **CRAFT_CLAIM** in one sentence at the top of `reference.md`.

## Phase 1 — Plan the architecture, choose the views, write the gates

### Replay units

Represent the work as ordered replay units whose granularity matches the
craft: strokes or dabs for brushwork, registered impressions for printing,
paths and fills for SVG, whatever the visible making action is. Each unit
belongs to a stage and carries every choice it needs — position, size, alpha,
jitter, colour — made when it is built. Its draw function makes no fresh random
or compositional choice; it may read stable shared geometry, masks and stage
state established at build time. Order units by the real action, taken from the
craft source you wrote down: the sequence inside one stroke is never reordered,
and neither are the craft's supported local passes — a passage carried from
contour through texture to wash before its neighbour is begun, and the returns
and reinforcements a maker makes to work already laid down. Sort spatially
within a stage only where the craft source supports that as the working order.

Where the craft prints rather than draws, the unit is the impression and the
contract between modules is the block separation: which forms share a block,
in what order the blocks are pulled, where each overlaps the last and where
the paper is left bare. A stage is then one impression or one closely related
group of them, and what a stroke-based craft resolves as brush order this one
resolves as separation — the same form appearing in two impressions is a
decision to write down, not an accident. Lettering carved into a block arrives
with its impression and is not a separate writing pass; only lettering added
by hand after printing is.
Right-to-left across a handscroll is how the finished work is read; it is not
evidence that every mark in a stage was laid down that way, and sorting dabs by
x will also cut a stroke into pieces that arrive out of order. Use impression
order for a print, and plain layer order where the action has no direction.

**Local passes inside a staged timeline.** A stage is a scrubbable position in
the replay, not a claim that the maker finished the whole surface in one
material before touching the next. Where the craft works passage by passage,
give each unit both its stage and its passage; order units by passage, and
within a passage by the craft's order; let the stage marker advance as each
passage reaches it. The timeline then reads as work moving across the surface
rather than as one global sweep per material. A later return to an earlier
passage is an ordinary later unit that happens to carry earlier coordinates —
keep it where the craft puts it instead of folding it back into the first pass.
State in `reference.md` which of the two the craft source supports, globally
staged or passage by passage, and build the timeline to match; that statement is
what the process sheet is judged against.

A static substrate may be baked once and revealed with progress when its
preparation lies outside the process being replayed. If sizing, grounding,
tinting or printing the substrate belongs to CRAFT_CLAIM, it is an ordinary
stage.

### Occlusion as the craft produces it

Reserve untouched ground where the original reserves it. Let later opaque work
cover earlier work where that is the real sequence. Use a generation mask only
where the process truly prevents a mark from being laid down, or where
semi-transparent later work would otherwise show an earlier layer the original
never lets through — the 千里 back mountains' washes were not generated behind
the front ones, because thin ochre would have bled through azurite. A line
drawing on silk occludes by not drawing the hidden line: the 武汉 run stamped
every object's footprint into a z-mask first and drew second, so a figure in
front breaks the contour of the one behind and no ground-coloured fill exists
(D-04). Choose per medium; write the choice into `wiki/plan.md`.

### Module owners against the contract

When the work has materially different mark families — architecture, figures,
boats, trees, water, ground, crowd placement, text — give each its own module
with one owner building against `interfaces.md`, self-rendered once in a
harness before integration; the integrator composes and owns `plan.md`'s
rules. Owners work in parallel when the host provides independently runnable
agents; otherwise the same modules are built sequentially against the same
contract, in dependency order. Either way the contract, not the integrator,
answers an owner's questions.

### Presentation

Choose it from the object. A sheet, an album leaf, a panel: show it whole at
the intended viewing size. An oversized scroll: an offscreen full surface, a
draggable viewport, a minimap with the viewport rectangle and a brush-position
cursor. Replay directly while it stays responsive; add stage-start snapshots
for backward scrubbing only when it visibly stalls, placed where they remove
the stall. Pace stages by the amount and character of visible work — a
whole-surface wash, a registered impression and a few final accents need not
take equal time — but keep the craft's order.

For an interactive page: play/pause, scrubbing, direct access to stages; speed
control or recording when the user or host needs them (MediaRecorder on the
visible canvas, saved through a host download capability only where the host
exposes one — inside the claude.ai artifact viewer that is the `downloads`
capability — and otherwise through the browser's ordinary download); deep links
to a progress value and viewport position
(`#p=…&cam=…`) so a stage can be shared. For a non-page deliverable, expose the
ordered stages in the medium's natural form — a sequenced path list, SVG
animation or layers, another directly inspectable replay.

### Fonts

Before drawing any text, load the complete final string in the chosen face
(`document.fonts.load(font, fullText)`) — web CJK fonts arrive in on-demand
Unicode subsets, and a load without the text leaves rare characters to fall
back to a system sans. Render the string once and look for fallback glyphs.
Use a face available both to the headless review render and to the delivered
work; a local-only face is acceptable only when the delivered geometry no
longer depends on it or the declared fallback is visually faithful.

### Views for the blind gate

Decide once, from the composition, and keep fixed: the whole work at the
intended viewing size; a viewport on every focal passage the user or the plan
named; representative crops of materially different passages (dense form,
quiet ground, water or sky, lettering if any); one diagnostic enlargement
(about 2.5×) of the dominant mark-making passage; for a scroll, both ends and
a middle. Then check the set against the plan's focal list, not against what
looks interesting: 黄鹤楼, 300 px tall, went unseen for eight rounds because it
stood between the bridge viewport and the 户部巷 viewport, and the user found it
faint and half-hidden (D-17). Add a view only when a passage cannot be judged
from the existing ones.

Also render one labelled **process contact sheet**: for each stage, a
before/after pair cropped to a passage that stage actually changes (one fixed
crop for all stages only when every stage materially affects it), each panel
large enough for the named material to be visible at the stated scale. It goes
to the reviewer in the first blind round and again whenever stage order or
replay-unit behaviour changes.

### Write `wiki/gates.md` before the first mark

**The one mechanical gate.** Replay determinism: capture the picture after
reaching full progress directly, and again after scrubbing backward and
returning to full progress through the page's own controls; compare the two
with a simple image diff. A repeatable difference means the two replay paths
disagree; find the cause before changing anything. A draw-time choice that
leaked into replay is one — move that choice to build time — and so are a layer,
transform or clip not reset on rewind, drawing state accumulated across the
scrub (a canvas never cleared, marks composited twice), and a font or asset that
had not finished loading on the first pass. This is the only universal
automatic check. Discarding polylines with fewer than two points and fixing a
console exception at full progress are hygiene, not gates. Judge
responsiveness by whether playback and scrubbing react promptly; do not import
another machine's build-time number.

Add a domain check only after a concrete failure: "bridges land on land at
both ends" earned its line when a bridge floated; "water rows never cross"
when amplitude and spacing were set independently. A subject transfer's plan
rules — chosen in Phase 0 from the current subject, never inherited from another
run — are the integrator's first-look list before each round, not gates. (The
武汉 run's were its own: the bridge as the density peak, no cars, at most
fourteen readable boards. A present-day riverbank drawn under a rule against
cars is a picture ruled against its own subject.) Never pre-write a gate.

**The blind questions** are the prompt in Phase 4; do not restate them here.
What `gates.md` records is what this particular work adds to them: the focal
passages that must be recognisable, and any whole-picture quality the user has
named, in the user's words.

**The pass criteria**, verbatim into the file:

- *Blind pass:* "At the stated viewing size, beside the style windows, the
  reviewer judges the work plausibly a product of CRAFT_CLAIM and names no
  remaining computer-origin tell material enough to warrant another repaint;
  no material error in the represented working sequence is left unresolved;
  every residual observation has a written reason not to pursue it. For a
  subject transfer, the reviewer names the place from the painting views before
  being told the subject." A stage endpoint shows what that stage added, and the
  process sheet is where that is judged; the order of actions inside a stage
  cannot be seen from endpoints and is judged against the ordered actions stated
  in `reference.md`.
- *Human pass:* the user accepts the rendered result after handoff; for a
  subject transfer, they recognise the subject and its focal passages.

A directional 0–10 may be recorded per round to read a trajectory; it is part
of neither pass, and a trajectory restarts when the reviewer model changes.

## Phase 2 — Draft

Derive each primitive from the mark vocabulary. Geometry follows the depicted
form, not a generic shape plus noise. Give one form one description and let
every mark family read it: describe the anatomy first — a ridge with its
summits, ledges, saddles and the planes between its spurs — then take the
contour from that description, the interior texture from the same ledges and
planes, and the pigment from the faces those planes present. Contour and
texture derived from separate functions produce the 千里 verdict 有色而骨弱: the
marks are individually right and do not belong to one body. Pigment and ink
accumulate with the source material's scale, direction, edge behaviour and
opacity. Repeated texture uses spacing measured at delivery scale. Lettering
reproduces the script's pressure, rhythm and ink behaviour. The ground carries
only texture visible in the reference. Test a representative passage at viewing
size and at the diagnostic enlargement before proliferating it across the work;
repeat that test whenever a primitive changes, and correct an obvious new
artifact (camouflage speckle, sponge spray) before the blind round.

**Working method for a module owner.** Write a skeleton of the module —
contract shape, one kind, one build — within the first few tool calls, render
it in the harness, then add one piece per edit and render again; the code is
the design. An owner who tries to design eight boat kinds and a bridge-hole
event before writing a line produces thinking and no file: the 武汉 boat module
stalled that way for an hour while seven siblings finished in 15–45 minutes,
and had to be stopped. Keep each module's scope to what one pass can
hold; split the rest into a second module.

### Calibration from the two runs — reuse the observation, re-measure the number

Values below come from one 4270 × 500 p5.js handscroll of 《千里江山图》 and one
5000 px handscroll of 武汉, at roughly 1 px ≈ 0.5–1 mm; decision numbers refer to
`examples/qianli-process/wiki/decisions.md`. A causal observation transfers only
when the new reference shows the same material and visual mechanism. Every
number is that run's local calibration. Remeasure all of them.

*Forms.* A triangle plus noise stays a tent at any noise level, and every layer
painted on it looks pasted (D-09). Walk the form as an anatomy instead: a crest
in 15–45 px segments with ledges, notches against the trend, secondary peaks,
and spur lines descending from peaks and ledges so that the region beside a spur
is one rock plane. Have the occlusion mask, the colour field and the texture all
read the same ridge function; one change to the anatomy then propagates instead
of being applied three times. Four repaints of that function still did not clear
the tent silhouette — a single shoreline of separate masses reads as assembled
scenery, whatever the crest does — and only interlocking masses, each with its
own outline, ledges and lit and shaded face, addressed it (D-20).

*Colour.* Horizontal band strokes put scanlines through every layer at every
alpha and could not be tuned out. Dabs replaced them (D-11): soft
radial-gradient discs on a jittered 3–5 px grid, radius clamped to 0.9 × the
distance to the outline so pigment stays inside the ink, alpha derived from
target coverage and expected overlap — a = 1 − (1 − ink)^(1/overlap), overlap =
π r² / step². That formula is the transferable part. Decide pigment per plane,
not per altitude, and leave planes bare (45% carried no azurite). Two validated
failures: a dense pigment core reads as sponge spray, and a noise field too fine
for the scale (0.028 per px where 0.011–0.013 worked) reads as camouflage
speckle.

*Ink.* Breaks belong in coherent chunks — outlines dropped in whole 32–60 px
pieces, since per-point breaking made dotted debris — and texture strokes follow
the relief, denser on the shaded side. Ink goes into mass where the craft puts
it: under eaves, in hull bellies, at bearing joints, in trunk knots and hair,
not into every line. The 武汉 run's first repaint gave every line 起笔收笔 hooks
and beads; the next reviewer called the result distressed rather than written,
and said a line's weight matters more than whether it tapers (B2). D-08 removed
the hooks, kept a width gradient at the ends alone, dropped all three grades a
quarter, and gave branches and 皴 no ends at all while ruler lines kept their
discipline.

*Water.* At 1 px ≈ 1 mm the 网巾纹 is not lines but a texture: rows 1.7–2.6 px
apart, alpha 13–27, wavelength 24–40 px, amplitude under 40% of row spacing,
adjacent rows half a wavelength out of phase, a 1–2 px inward bend near land, in
chunks of 70–190 px with random boundaries. The scale number settled a two-round
argument: the reviewer's remedy (erase 70% of the lines) was wrong for this
reference and its complaint (a plotting grid) was right (D-13). One real bug on
the way — adjacent chunks sharing two endpoints drew the joint twice, a brick
wall of dark ticks (D-15).

*Lettering.* Where a script has no path data a font can supply the skeleton, but
connected components find connected ink regions, not strokes: they recover
neither stroke order nor direction, and they merge strokes that touch. Let them
guide where ink lies and how thickly, and drive the replay from ordered stroke
paths — path data, a stroke-order source, or a skeleton traced in writing order.
With none of those available, leave optional lettering out of the first version
rather than replaying a fiction. Brush quality came from ink behaviour: a
per-character ink budget (8–16%, reloaded every 3–7 characters — a per-dab decay
dried large characters halfway), width modulated 0.55–1.45 along the stroke's
principal axis with the last ~28% tapering, dry-brush gaps as one to three
bristle lines parallel to the axis and only when dry (isotropic pinholes read as
distressed type). It did not come from distorting the skeleton: warp, tilt and
column wander added on a reviewer's advice produced 「这个字怎么歪歪扭扭的」 from
the user and all came back to near zero (D-18), the ink behaviour staying.
Upright columns are the paper's, not the machine's, and a title's slant can come
from the face itself (D-25: an italic 行楷 face replaced by 楷). A reviewer's
number for a deformation is a direction to start at the smallest visible amount.
Lettering is the one passage to show the user before the next blind round,
because they judge it at a glance.

*Ground.* Large translucent polygons read as low-poly camouflage at whole-work
scale; r 400–900 soft blobs baked into the silk read as screen lighting; sparse
large stains read as cloud-like shading in blank passages. All three came out,
until nothing remained but per-pixel grain (±5 per channel), 1–1.5 px warp lines
at alpha 3–4 and broken weft fibres at alpha 2–3 — after which the reviewer
stopped ranking the ground.

## Phase 3 — Render, hygiene, and the optional source round

This phase needs two facilities: a headless browser that can drive the page, and
a way to crop images and diff two of them. Identify the actual commands for both
before the first render, and say so plainly rather than proceeding if the host
has neither.

Render the VIEWS and the process sheet headlessly with whatever browser is
installed, driving the page's own progress and viewport controls (deep links
or scripted clicks). For Edge or Chrome on macOS one screenshot is:

```bash
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new \
  --disable-gpu --hide-scrollbars --window-size=1000,700 --virtual-time-budget=<SETTLE_MS> \
  --screenshot="$PWD/review/mid.png" "file://$PWD/preview.html#p=1&cam=0.42"
```

Set SETTLE_MS from the observed build and font-load time. Use `file://` only
for a self-contained deliverable; if the work loads modules, fonts or assets
through requests, render over HTTP — the project's existing preview URL, or for
a new project a local HTTP server started in `PROJECT_DIR`, whose URL then
serves both the review renders and the handoff launch instruction. If
the deliverable is artifact HTML without a document skeleton, wrap it in a
minimal `<!doctype html><html><head><meta charset="utf-8"></head><body>` for
the preview. Crop and diff with the image tool already at hand; add no helper
to the project for this.

Look at every render once, for breakage only: blank canvas, fallback glyphs, a
missing layer, colour outside its outline, a crop that does not show what its
label says (B2 caught a reference detail that missed the bridge crowd and a
view labelled for the wrong end). Fix breakage before the reviewer sees it. Do
not grade. Run the replay-determinism gate and note the result in
`wiki/review-log.md`.

**Source round, only if needed, only before the first blind round.** When a
concrete implementation uncertainty remains that pixels cannot answer — stage
order, replay state, clipping — ask a code-capable model to read the source in a
separate context, with the paths and the scope block. In the 千里 run two such
rounds found randomness inside draw closures and a wrong colophon date. Fix what
affects the picture or the process, then begin the blind rounds. This is not a
visual gate and is not repeated once the issue is settled.

## Phase 4 — Blind review

A fresh review context each round, read-only, prompt naming only image paths.
Nothing about the algorithm. The first request is one sentence describing one
image, so you know it looked.

**For a subject transfer, ask about the place before saying what it is.** In
round 1, and again after any change to a focal passage, open the round with the
painting views alone — no subject, no reference, no craft claim, and file names
that do not name the place — and ask only:
只看图,这是哪座城市(或哪个地方),凭什么?如果说不出,缺的是什么? Record that
answer; it is the recognition evidence, and an answer given after being told the
subject is worth nothing. Then supply the subject, the reference and the style
windows in the same context and continue with the craft review below.

The block below is one installation's interface. Send the same prompt through
whatever reviewer interface this host exposes.

```
mcp__codex__codex:
  sandbox: read-only
  cwd: <PROJECT_DIR>
  prompt: |
    Blind visual review, round <N>. Judge only from the images; do not read
    source. Use your image-viewing tool to open:
    Style source — the craft the work claims, at the same viewing size:
    - <STYLE_WINDOWS>/<window>.png       (…one line per window: passage and scale)
    - <STYLE_WINDOWS>/<detail>.png       (2.5× of <the reference's dominant mark-making>)
    The work:
    - <PROJECT_DIR>/review/whole.png     (the whole work at viewing size, <W×H>)
    - <PROJECT_DIR>/review/<view>.png    (…one line per fixed view, with its passage and scale)
    - <PROJECT_DIR>/review/detail.png    (2.5× of <the dominant mark-making passage>)
    [Round 1, and after any change of stage order or replay unit:]
    - <PROJECT_DIR>/review/process.png   (labelled before/after pair for every
      stage; each pair shows a passage that stage changes)
    [Round ≥ 2, one line for each passage a quoted observation names:]
    - <PROJECT_DIR>/review/prev/<view>.png  (the same crop, round <N-1>)

    Confirm you can see them with one sentence about detail.png.

    The work is a code-drawn picture of <SUBJECT> in the craft of <reference>:
    <CRAFT_CLAIM>, at <viewing size>, replaying the order <stages>. The
    windows show the craft, not the scene: judge whether the work reads as a
    product of that craft beside them, never whether it resembles the
    reference's composition or motifs.
    [Round ≥ 2:]
    Unresolved observations from round <N-1>, quoted:
    <paste them verbatim>
    Passages an earlier round said hold, to be protected unless a craft or
    subject correction requires otherwise:
    <one line each>
    Settled against the reference and not to be reopened without new evidence
    in these images:
    <one line each, with the reference evidence>
    Visible change made for this round, in the craft's terms:
    <one sentence, such as "the near girder's shaded face is now one graded
    ink plane with the heaviest stroke at each pier"; no parameter values>

    Answer as a maker and connoisseur of <tradition> would:
    1. What reads as computer-drawn rather than <CRAFT_CLAIM>, ranked by how
       much it hurts the craft claim. For each: what you see and the one
       change that would help most. [Round ≥ 2:] Say whether that change is a
       parameter of the present construction or needs a different
       construction. The images are at <mm or px scale>; give numbers where
       that scale makes them reliable.
    [Round ≥ 2:] 2. For each quoted observation: still material / visible but
       no longer dominant / gone, with one line of evidence from these images.
       [Only for passages whose prev/ view is supplied:] <view>.png and
       prev/<view>.png are the same crop this round and last: say whether that
       passage is worse than before, and in what.
    [When process.png is supplied:] 3. In process.png, does each after-panel
       add the named material in a visually plausible way relative to its
       before-panel, and is the listed stage order plausible for <tradition>?
       Name the stage and the visible mismatch when it is not.
    [While lettering exists and is unresolved:] 4. Lettering: written or set?
       If set, is the giveaway the glyph skeleton, the stroke behaviour
       (pressure, dry brush, ink load) or the layout (spacing, rhythm)?
       Upright columns are the paper's, not a fault.
    [Round 1:] 5. What already holds and should constrain later repainting.
    [Round ≥ 2:] 6. Which passages now hold at viewing size — name each, say
       what must not be undone there. Beyond the quoted observations, what
       other computer-origin tell is now material enough to affect the next
       repaint?
    [When the user has named a whole-picture quality:] 7. <the user's words,
       and for a tonal one the measurement of comparable passages at the same
       scale: "a dense passage and a quiet passage of the windows average
       luminance 112–118 with local contrast 19–21; the same two passages of
       the work, 136 and 12">. In the craft's terms, where does the difference
       come from and what would the painter do about it?
    [Optional, for trajectory only:] 8. One 0–10 for "reads as <CRAFT_CLAIM>
       at viewing size". The number does not decide whether the gate passes.

    === SCOPE LIMITS (these bound what you PROPOSE, never what you look for) ===
    1. Not a security product. Cooperating operator on their own machine. No
       over-defense.
    2. No hashes, checksums or fingerprints.
    3. No defensive scaffolding: no feature flags, migration frameworks,
       compatibility layers, wrappers, validators, evidence files or JSON state
       machines.
    4. No corner-case obsession.
    5. Where judgement is needed, judge; no scoring tables, checklists, or
       re-verification of settled things.
    6. Propose the direct visual or craft change, not helper programs or gate
       machinery.
    7. Deliverable text is not a defense transcript; no caveat sprinkling.
    Report anything actually wrong. Say plainly when something is right. Be
    concrete and blunt. No preamble.
```

Read the reply as a colleague's opinion. Before editing anything, distil it
into `wiki/review-log.md`: the reviewer model; for each unresolved tell, one
short reviewer sentence quoted verbatim — that quote is what the next fresh
context receives — with its parameter-or-primitive call, followed by the action
you accept or the decision that overrules it; the passages that hold; the
recognition answer for a transfer; the process judgement when the sheet was
reviewed; any newly material tell; the determinism result. Keep the round's
views under `review/prev/` so the next round can show the passages a quoted
observation names. Do not archive the raw reply; quote only what the next round
needs.

Rules for using it:

- **A score given without the style windows is not comparable to one given
  with them, and a score from a different reviewer model is a new baseline.**
  In the 千里 run the number fell from 5.8 to 4.0 the round the reviewer first
  saw the original; nothing had got worse. The 武汉 run changed reviewer after
  B1 and restarted its trajectory at B2's 4.5.
- **Disagreements go to the style windows.** Decide whether the observed
  feature belongs to the craft, to the reproduction you are following, or to
  your implementation. The reviewer's "the river needs no full water texture"
  lost to the 汴河's edge-to-edge lines (D-19); its "the ochre is the whole
  background" lost to the oxidised silk measured from the reproduction
  (D-06). Record the decision once; reopen it only when later pixels supply
  new evidence.
- **Its ranking is the gate; its remedies are suggestions; its passages that
  hold are the positive gate.** "Rebuild the mountains as interlocking rock
  masses" is a direction; the numbers are yours. A passage it names as holding
  is protected in every later repaint — protect what that quality does in the
  picture, the weight or depth or rhythm it carries, not its exact shape; when a
  stated craft or subject correction forces a change there, make it and write
  down what carries the quality afterwards. Its parameter-or-primitive call is a
  hypothesis about an implementation it cannot see: check it against the code,
  change the primitive when the construction is genuinely what prevents the
  result, tune when the present construction can produce it, and either way
  confirm the edit reaches the marks in question.
- **It can misidentify the object.** B5 prescribed a rounded mat-roof shell for
  a boat under the bridge; B6 looked again — 「该改的是桥下驳船的盖货篷布……上一轮那条
  处方应当改正」 — and the barge got a tarpaulin over its load instead
  (D-14). Quote the self-correction back in the next prompt and fix the object
  the reviewer meant, not the one it first named.
- **The user's look comes between rounds and names things the reviewer cannot.**
  They see the whole at viewing size and judge focal passages and
  recognisability at a glance (D-17, D-18). When they name a whole-picture
  quality, answer it in the terms they used. A tonal complaint — 「有点白,想要
  一点丹青和做旧」 — is measurable: take mean luminance and local contrast from
  comparable passages of the windows and of the work at the same scale, dense
  against dense and quiet against quiet, since a blank-water window held against
  a crowded street measures composition and not ink. Put those numbers to the
  reviewer as question 7 and ask for the painter's prescription; the answer was
  ink mass into 瓦、檐下、船壳、树干节疤、头发 and transparent colour layers, with
  the silk only 5–8% darker — not darker lines and not a darker ground (D-19).
  Rhythm, vitality, geographical clarity and whether the river looks like today
  are not luminance: put those to the reviewer in the user's own words, and
  judge them by looking.

## Phase 5 — Decide, in writing

`wiki/decisions.md` — numbered, dated entries: what was decided; why; what the
reviewer said if it was involved; the reference evidence when you overruled
it; and "tried and reverted" notes with the observation that told you so. The
two shapes a reader needs, from the runs:

- An overrule, carrying the reference evidence: "石青 stays opaque although the
  reviewer proposed alpha 82 — the original's mineral layers are opaque; the
  reviewer judged by general ink-painting taste."
- A tried-and-reverted, carrying the observation and the version returned to:
  "Tried 0.8–1.35 × random row spacing to break the water rhythm: clumped into
  horizontal bands. Reverted to 0.92–1.1." Broad independent variation failed
  for this texture at this scale; that is not a universal threshold.

An entry that revises an earlier one names which, so the superseded decision is
not re-derived later.

Add to `decisions.md` only when a choice constrains later work or a change
was reverted. Update `gates.md` only when a check earned its way in during
the round.

## Phase 6 — Repaint

Make the smallest coherent repaint that addresses the highest unresolved
tell, including the supporting changes the new primitive needs; combine
unrelated fixes only when each will be independently visible next round. A
primitive change usually overshoots on the first try (the first dabbed
azurite was camouflage speckle; the first pressured line was hooks and beads):
run Phase 2's representative-passage render before applying it across the
work. When the reviewer judges a primitive change a regression — having seen the
previous view beside the current one, since otherwise it is answering only
whether the quoted problem is still visible — revert that module to the previous
version and apply only the minimal fix it named; do not build the next attempt
on the regression (D-13, trees v5 → v6, taken back in one round). Keep the
process animation truthful as primitives change: if pigment is now dabs, the
石青 stage shows dabs accumulating in the order the passage was worked.

Immediately after the repaint, append one terse line to `review-log.md`
naming the visible change and saying the new render awaits blind review; this
is what lets a later session tell changed-but-unreviewed code from an
unapplied review.

Render every applied round to the same local entry path so the trajectory is
easy to inspect. If the environment already has a publication path (an
artifact host) and the user wants to watch, publish each round to the same
URL with the round as its label. Put the whole at viewing size in front of
the user every few rounds without waiting for the pass: their look between
B8 and B9 of the 武汉 run added a view, a question and a decision the reviewer
could never have produced.

Then Phase 3 again.

## Resuming after a break or a context reset

The wiki is the state. Read `reference.md`, `plan.md`, `interfaces.md` when
it exists, `decisions.md`, `gates.md`, then the last entry of
`review-log.md`; open the current render.

**Before the first review exists** — `review-log.md` has no round, so the break
fell inside the first draft — find where it stopped from what is on disk, and
finish that phase from the work already recorded rather than restarting it. No
`reference.md` carrying a craft claim, a scale and an order of work means
Phase 0's study is unfinished. For a transfer, no focal passages and no
present-subject record in `plan.md` means the subject research is unfinished:
choose and state the passages yourself and go on. A `plan.md` and
`interfaces.md` with modules that render in their harness but not in the
composition means integration is unfinished. Carry it through to the first full
render and the determinism check, then enter the review loop.

If the last entry is a review not yet applied, continue with its highest
unresolved tell (Phase 6). If it is a repaint awaiting review, render and go to
the blind gate (Phase 3). Do not re-run a blind round on an unchanged picture,
and do not re-research a settled decision unless the current image contradicts
it. Review contexts do not survive a break and need not: every round starts
fresh and receives the previous unresolved observations quoted, the protected
passages, and the previous views of the passages those observations name.

## Stop, and hand over

Stop the automated rounds when the blind pass is met, when ROUND_BUDGET is
spent, or when the user says so; then perform the human handoff. Where the host
has no separate vision-capable reviewer, there are no rounds to stop: hand over
at the first complete render, say plainly that the work is an unreviewed draft,
and name the tells you would put to a reviewer first. The final message states
which of those happened; names what the reviewer still
lists and which of those have a written decision not to pursue; names the
passages the reviewer says hold; gives the next primitive change if another
round were taken; and hands over the runnable entry file or existing link, a
one-line launch instruction when needed, and the project directory with its
wiki. Then it puts the final render in front of the user. The result is
complete when the user accepts it; a visible failure they name becomes the
next repaint when a round is available. Do not describe the picture as nearly
indistinguishable when the log says otherwise.

## Worked example — 《千里江山图》 → p5.js handscroll

The full wiki is in `examples/qianli-process/`. The subject is the
reference's own scene. In brief: two source rounds, then six blind rounds. B1
named, in order: tent mountains with altitude-band colour; a uniform cobalt
rim; texture strokes as scanlines; water as a plotting grid; a typeset
colophon; symbol trees; airbrush mist; icon boats and houses; low-poly silk.
It also named what held — scroll rhythm, empty water, human scale, the
blue–green–ochre relationship, sparse waterfalls — and those were protected
thereafter.

By B6 the rim was gone ("landed" in B4), the pigment scanlines were gone, the
water read as texture at viewing size, and the lettering had moved from
"typeset" to "close to hand" with tells remaining. The reviewer first offered
an overall number in B5 (4.5) and gave 5.8 in B6.

Then the loop was re-run under this skill as written (B7, B8), which changed
two things: the reviewer received the fixed reference image for the first time,
and a per-stage process sheet. The number fell to 4.0 and stayed there. That
drop is the most useful fact in the run: the earlier 5.8 was awarded without a
comparison target, so rounds 1–6 were partly graded against the reviewer's
general taste. Give the windows from round 1. With the reference beside it
the reviewer's list settled into a structural verdict — "assembled scenery"
(separate masses on one shoreline, 180–230 mm openings, 200–320 mm flanks
without change of plane), "digital mottling" at one 3–10 mm scale regardless of
colour, and 有色而骨弱. Two rounds of "still material" on the same top item after
coherent repaints was the primitive signal, and D-20 rebuilt the mountains as
rock masses (v4.0). B9 scored that 3.5: the fold lines read as seams, not bones,
and the colour as a program's height map. That last item was overruled from the
reference, which layers exactly so (D-21); B9's three ink grades, staggered back
feet and unsegmented water tint went in (D-22). Two rounds without a score
followed: B10 took the blue outline off the board for good; B11 called the
enlarged azurite sediment
「蓝色淤青」 and D-24 reverted it. The run stopped at v4.3 after eleven blind
rounds with the gate not passed — mountain geometry led round 1's list and
still does — and six things twice confirmed sound: colour-layer order,
near–far depth with hidden feet, blank-space rhythm, staffage scale, broken
heavy outline, one water colour. If resumed: overlapping rock masses each
with its own contour and 皴, pigment following the mass, not the altitude.

## Worked example — 《清明上河图》 → 武汉 → p5.js handscroll

The wiki is in `examples/qingming-wuhan/`. A subject transfer: 张择端's craft
(绢本淡设色工笔界画, 1 px ≈ 0.5 mm at 500 px) on a 5000 px 画心 of present-day
武汉 — 东湖, 黄鹤楼, 户部巷, 长江大桥 as the crowd's peak, 晴川阁, 汉正街, 江汉关, a new
colophon on the 拖尾. Eleven versions, eleven blind rounds; 3.5 → 7.0.

Study first: three compositions ranked by three judges (D-02); a
specification with stations, counts, rules and a module contract (D-03,
D-05); eight module owners in parallel, two-phase z-mask occlusion (D-04).
The heaviest module stalled on design before writing a line — Phase 2's
working method is that lesson.

B1 (gpt-5.6-sol, 3.5) ranked: one-width ink line without 提按; interchangeable
figures; 界画 with every edge equal and no occlusion; a screen-lit silk
gradient; trees rising from nothing; stamp-like water packets; a set colophon;
and the density climax at the left city, not the bridge (D-07). D-06 changed
four primitives and overruled two remedies on the record: upright colophon,
measured silk tone. B2 (gpt-6-astra from here; new baseline, 4.5) confirmed
「Plumb columns are not a fault」 and called D-06's hooked line ends a
regression — weight over taper — so D-08 removed them and thinned the grades a
quarter. B3 (5.5): deck contact, rail occlusion and the tug behind the deck
cleared (D-09); the reviewer began marking each tell parameter or primitive —
one parameter, five primitives — and D-10 rebuilt the five (action groups,
continuous street rows, closed boat volumes, trees from sweeps, seals cut
before stamping). B4 (6.0): seals gone. B5 (6.0): tug clearance gone (D-11,
D-12); the tree rebuild 「本轮最大的退步」 — D-13 reverted the module and applied
only the named fix; B6 (6.3) took it back. B5 had prescribed a mat shell for a
boat that was a barge; B6 corrected itself, D-14 dropped the prescription.
From B6 the reviewer listed passages that hold — the 豆皮 stall, the 东湖 huts,
the corner house, 江汉关 with its ferry queue, from B7 the barge's gunwale — and
all held to B9. B7 (6.5): lettering gone (端楷, D-14); a new tell, cloud-like
silk shading, gone by B9 (D-15, D-16). B9 (6.8): 磨山 and the near girder no
longer dominant. Figures were "still material" in every round: after D-06,
four constructions — action groups (D-10), a body under the clothes (D-12), a
load chain (D-14), a closed outline (D-15) — then D-16's fifth, a silhouette
family traced from the reference's 2.5× details, which B9 called 「实质改变」
with a new cost, 衣套同形感.

Between B8 and B9 the user looked. No 黄鹤楼: 300 px tall, between two
viewports, unseen for eight rounds — a fixed view and the scroll's heaviest
界画 (D-17). It must read as 武汉 — bridge towers and double deck, 户部巷's
boards, 江汉关's clock, a city question in the prompt (D-18; B9: 「武汉,能认」,
the bridge's own character still weak). And 「有点白」: windows at mean
luminance 112–118, contrast 19–21; the work 136, 12. Asked in the craft's
terms, B9 prescribed ink mass into 瓦、檐下、船壳、树干节疤、头发 to 80% of the
original's contrast, silk 5–8% darker and warmer, transparent colour layers,
朱砂 redistributed not added, a few 折痕 — no darker lines, no soft stains, no
vignette (D-19). Its one remedy the reference contradicted, a blank river,
lost. v10 carried D-17 to D-19: B10 (6.8) called 黄鹤楼 the architectural
climax and the ground and 朱砂 done, ink mass and washes half done, and the new
river texture the round's regression — 「江水现在读作图案」 — while retracting
its own blank-river advice. v11 (B11, 7.0) laid the water as long lines
following the current, made the 桥头堡 broad blocks that run down into the
abutment, gave the tower's middle storey a colonnade, and decided the large
figures' outlines by their action; eight passages hold and the reviewer wrote
a closing judgement for publication. The run stopped there by decision
(D-22): the gate was not passed — figures 「仍是动作模板,且模板开始成排」,
water 「横向织纹」, building members 「等量重复」 — and the next repaint is
written down: the three at the e-bike as one force-shape, and water lines
grouped as one current rather than row after row. One bug outlived nine
rounds: walls were never in the occlusion mask, so everything behind a wall
drew through it (D-20) — the reviewer named the symptom from B1, the executor
fixed nine other things first.

## What this skill is not

Not an image generator, and it calls none. Not a copy machine: in 意临 mode
the reference fixes what things look like, in 风格迁移 mode it fixes only the
craft, and in neither does a likeness score end a run. Not a fidelity score: the optional number is one
reviewer's direction-finder. Not a substitute for looking: it ends by putting
the picture in front of the user.
