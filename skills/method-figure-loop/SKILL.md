---
name: method-figure-loop
description: ALIGN for paper figures — draw a method-overview figure as an executable p5.js program that replays its own construction in named stages, exports SVG, and improves through pixel-only cross-model review whose gate is 'explain the method back from the figure alone, and is it worth looking at'. The method sets the relationships the figure must show, the chosen visual identity sets how its marks look, a composition source lends arrangements; the method may be the source's own (意临) or yours in its arrangement (风格迁移). Not for one-shot raster image generation.
argument-hint: "[composition source] → [method to convey] → p5.js"
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep, WebFetch, Skill, Artifact, mcp__codex__codex, mcp__codex__codex-reply
---

# Method Figure Loop (ALIGN) — a figure that makes itself, judged blind

> 🔒 Do not wrap this skill in `/loop`, `/schedule` or a cron. It loops internally
> (render → blind review → decide → redraw), and a round is triggered by a change
> in the figure, not by the clock.

You are given a composition source — a published method-overview figure, a
paper's or a repo's Figure 1 whose arrangement you want — a method the figure
must convey, and a medium the result must be *written in*: p5.js in a browser,
with the p5.js-svg renderer beside it so the same program renders the canvas
the reviewer sees and exports the SVG the paper prints.

**The method determines the relationships the figure must show. The chosen
visual identity determines how its marks look. The composition source supplies
useful arrangements, proportions and distinctions; borrow them where they serve
this method. The user decides the intended identity and emphasis.** A source's
missing connector, diamond, thumbnail, empty region or headline is not a reason
to retain something that fails in this figure.

You produce a page that replays the building of the figure in the order a
designer builds it, and you keep improving it until a reviewer who sees only
rendered pixels can explain the method back from the figure alone — every
move, in order, every fact — and says the figure is worth looking at, naming
no template-made tell worth another round. The user's acceptance is the last
gate, and their first look comes early, on the first complete composition,
not at the end.

Two modes, both legitimate. **意临** — the method is the source's own (the
paper's Figure 1 redrawn as a program): the source's own panels then say what
the method says, and the reviewer's explanation may be held against the paper's
method section. **风格迁移** — the arrangement from the source, a new method
(ARIS-Movie-Director's Figure 1 → ALIGN's loop): 取其法,不取其景, and nothing in
the loop judges resemblance to the source's content, only whether the work
reads as a figure designed for this method and whether the method can be told
back from it. The second is the more interesting one and the one this skill
leads with; the first is not deprecated.

This is the ARIS loop (plan · draft · adversarial review · iterate · persist)
applied to a figure. Three things are specific to figures and are why this is
not `/auto-review-loop`:

- **The reviewer is blind to the code and, in round 1, to the source.** A
  model that reads the generator reviews the layout algorithm; a model that
  reads `method.md` reviews its own memory of the method; a model that sees
  only the rendered figure reviews what a reader will get. A vision reviewer
  can open local images: give it paths and tell it to use its own image tool.
  From
  round 2 it sees the composition source too — for arrangement comparison
  only, never to compare one method with another, and never to judge the
  work's palette or materials.
- **Each disagreement goes to what actually decides it.** A reviewer applies
  general taste. `method.md` says which relationships the figure owes and
  which facts it states; the chosen identity says what the marks look like;
  the word budget says what there is room for; the user rules on identity and
  emphasis. When the reviewer asks for a legend entry the budget cannot carry,
  the budget wins and the line's own label changes instead; when it says a
  panel is unclear, the account in `method.md` says what that panel had to
  carry. A decision that constrains later work is written down, once.
- **Primitives beat parameters.** When a coherent parameter change that should
  affect a visible tell leaves it materially unchanged — the retry arrow
  re-coloured twice and still read as main flow — stop tuning that
  representation and reconsider the primitive: a different arrow kind, a split
  panel, a band where there was a panel. When the reviewer says a tell needs a
  different construction, test that at the primitive rather than tuning the
  same representation once more.

Everything you and the reviewer propose is bounded by
[HERO](https://github.com/wanshuiyin/HERO-Anti-OverDefense): no hashes, no
defensive scaffolding, no corner-case obsession, no rubric where judgement is
called for, no stalling. An art tool, a cooperating operator, their own machine.
The scope block in Phase 4 travels verbatim in every reviewer prompt.

## Context: $ARGUMENTS

## Constants

- **REVIEWER** — a separate, vision-capable model that can open the local
  renders. The operator supplies whatever independent vision reviewer they
  have; the tool names in this file are installation-specific examples (in an
  ARIS installation, Codex through `mcp__codex__codex`, model and effort from
  the operator's `~/.codex/config.toml`). Fresh thread per blind round, the
  round's second half as a follow-up in that same thread, calls serial. If no
  such reviewer is available, say so before the first blind round, finish the
  work, and hand over the runnable draft explicitly as unreviewed — your own
  look does not substitute, and neither does your own explanation of the
  method. A change of reviewer model starts a new
  score baseline.
- **ROUND_BUDGET** — from the invocation; default 5 blind rounds when none is
  given, because a figure wants fewer and larger rounds than a painting
  (Phase 6). The painting runs took eleven rounds each; ALIGN's own figure took
  five blind rounds over seven versions and did not pass its gate. Data
  points, not limits.
- **CRAFT_CLAIM** — fixed in Phase 0, identity and arrangement in one sentence
  ("a method overview drawn by this project's authors in its own ink-on-silk
  idiom, in the arrangement of <source>: three numbered stage bands read top
  to bottom, panels with a title and a one-line subtitle, four line kinds by
  meaning, legend and rule panel below"). The reviewer judges execution
  against this claim — never "a nice figure" in general, never the source's
  content, and never the distance between the work's materials and the
  source's. A user ruling rewrites the claim; update the affected instructions
  in the current plan.
- **METHOD** — what the figure is of, fixed in `wiki/method.md`: the
  relationships a reader must be able to recover, numbered and in order; the
  facts the figure states; and the implementation detail deliberately left to
  the caption. That scope holds through review, and does not shrink when the
  budget gets uncomfortable. The user names what must be on the figure; their
  look decides the focal elements.
- **STYLE_WINDOWS** — the composition source fixed in Phase 0 at its reading
  size, plus 2× crops of the passages whose arrangement you borrow: its
  densest band, its legend and rule panel, one step panel. Cut once; shown from
  round 2 on, never in round 1, and for arrangement, grammar and hierarchy
  only — the identity is the chosen one.
- **PROJECT_DIR** — the path or existing project the user supplied; otherwise a
  short obvious `./<slug>/`. It holds `figure.html`, `wiki/`, `thumbs/` (the
  raster crops the figure embeds) and the working review renders; add `src/`
  only when the implementation actually has separate source parts.
- **VIEWS** — the reading view, always: the whole figure at the width where
  its reader meets it. Beside it, the diagnostic crops this round needs, kept
  stable while their subjects are stable and recut when a redesign moves them.
  The process sheet goes only to the first construction review and after the
  replay sequence changes.
- **CANVAS** — 1800 × 1000 by default; both the canvas and the SVG viewBox.
  Change it only when the figure's own content demands it, in Phase 0, once.
  State the **display width** separately: an 1800 px export shown in a README
  column at 900 CSS px is read at 900, and every type and line decision
  answers to that number, not to the export.

Override in the invocation: `/method-figure-loop "SenseNova-U1 Fig. 3 → our
looped decoder → p5.js" — rounds: 4`.

## Doctrine

Blind review judges pixels against the method and the craft: round 1 asks a
reader who has never seen the paper to tell the method back, and from round 2
the composition source sits beside the work for arrangement comparison — not
source code, not `method.md`, not the source's own method. `method.md`
determines the relationships the figure must show; the chosen visual
identity determines how its marks look; the composition source supplies
arrangements to borrow where they serve this method; the user decides identity
and emphasis; a decision that constrains later work is written once. The function a held passage
carries is protected; its shape and its material are not. Every choice a mark
needs is made when the mark is built, never when it is drawn, so replay is
exact and the SVG is the canvas. A visible failure that outlives a coherent
parameter change is a primitive problem once you have established that the
changed code reached the marks in question — a dead edit and a wrong primitive
look identical from outside. A loop can drive itself; only the
reviewer, and then the user, can acquit.

## Phase 0 — Fix the identity and the composition source, and study both

**Ask the identity question first.** Establish whose visual language the
figure speaks: the project's, the venue's, or a particular reference's. Use
the user's brief and the project's existing work to answer, and ask when they
leave a real choice — this is the question that decides palette, typography
and illustration, and it is expensive to answer late. State what the
composition source contributes and what the project contributes before any of
those choices. A venue determines delivery conditions; it does not
automatically supply the figure's identity.

**Fix the composition source next.** Open the exact figure you borrow from —
the arXiv version, the README commit, the page it sits on — keep a local copy,
and record in `wiki/reference.md`: its source and version (a v2 figure often
has a different legend and one more band than v1), its printed or displayed
width (single column, double column, README hero), the crop if you take only
part of it, the aspect you will use, and the reading size — the size at which
a reader actually meets it. Cut the STYLE_WINDOWS from it now. Every later
measurement of the arrangement refers to this one image at this one size.
Enlargements diagnose the panel grammar and the heads; they do not set the
finish standard.

**Establish scale from the display width.** State the width at which your
reader meets the figure, separately from the canvas, and set the smallest
required text from that width in the actual face and script you will use.
Establish the rest of the hierarchy with size, weight and face, and drop any
size that performs no distinct job — counting the figure's title and tagline
among them. Shorten text and reallocate space before lowering the reading
floor. The floor settles the word budget before anyone argues about it: a
panel 300 px wide at 1800 px across carries one title and one line of six or
seven words at the floor, and a figure of nine such panels plus a legend has
room for about seventy words. Treat what is not individually resolved at
reading size — the ticks inside an icon, the text inside a crop — as texture
the reader sees as "a plot", "a page of numbered decisions", never as
something they read.

**Write the order of work.** Labels, illustrations, panel dimensions and
connections are designed together; the replay shows their assembly, and the
stages are named after that design is made, from what this figure actually
contains. A thumbnail stage exists only when thumbnails exist. If panels
arrive with their titles and subtitles, say so in the stage's name. Final
lettering may add connector labels and captions without pretending all the
text was designed last. For ALIGN's own figure the honest naming would have
been: regions and headings → labelled panels → connections → illustrations →
connector labels → legend, rule and showcase. Where the source's own order is
visible — a title strip that plainly went down first, a legend added last —
borrow it; otherwise state yours once in `reference.md`. Each stage is
something the user can scrub to. Name each stage for what it visibly adds, and
correct the label when it is wrong.

**Write the panel grammar.** Name each materially distinct family your method
needs and what each means: a stage band (a region with a numbered title,
holding panels), a step panel (title, subtitle, an illustration area), a gate,
a store (a wiki, a log), a release. The source's own families are the starting
inventory; what separates them in your figure comes from your identity — a
diamond tells a gate from a step in one idiom, a doubled 界画 rule does it in
another. Note width rules — are panels sized to their content or to a grid? —
the proportions inside a panel, and what a panel never contains (a paragraph;
a second illustration). One shape for a step, a gate and a store is the
figure's version of the 武汉 run's one line weight on every material, a tell in
every round until the grades were separated: the reader must know from the
shape alone which is which.

**Write the line grammar, by meaning.** Each line kind the method needs: what
it means (main flow, retry loop, repair loop, audit trace, data reference),
its weight, colour, dash, head, where it attaches (panel edge, never inside),
whether it carries a label and where the label sits. The main flow is the
heaviest and usually unlabelled; a loop that returns to an earlier panel is
lighter, coloured, and labelled with its condition and its limit ("RETRY ·
max 4/panel"); an audit trace is the thinnest and greyest. How many kinds
there are comes from this method's scope and from what a reader can tell apart
at reading size, not from how many the source drew.

**Write the palette by role.** Choose the ground, the panel fill and the
accents from the chosen identity, then give each a role: one accent per loop
kind, ink for the main flow, one colour for failure and one for pass, nothing
coloured for decoration. Separate regions by enough contrast to
survive the intended reading size — numbered bands may share one tint — and
keep the ground quiet enough for the method to read. Judge each line at
reading size on the chosen ground; adjust weight and opacity together. A
gradient or a shadow answers to the chosen identity and to reading size: keep
it when the identity uses it and it still reads at that size, drop it when it
is decoration — decoration is the tell a reader names without knowing why.

**Write the figure's explanatory scope, before the budget.** Write the short
account this figure must let a reader recover: who acts, what passes between
steps, what a decision changes, what persists through a loop, and what
produces the output or ends the process. Select from the method the facts this
figure promises to communicate; implementation detail that cannot earn space
goes to the caption or the surrounding text. Hold that scope steady through
review — neither silently drop a required relationship, nor expand the figure
to answer every question a reader could ask.

**Write the word budget, and spend it down.** Set the word budget from this
method's scope, the display width and the space available. Fit essential
labels at reading size. Leave room below the ceiling; pay
for essential additions by cutting weaker text. Spend first on actors,
transitions, conditions and outputs; repeated titles, slogans, example tags and
redundant legend text surrender their words when a required relationship needs
them. Fit essential wording in both scripts at reading size: characters still
take width and attention whatever the language, and changing language is not a
way to evade the visual budget.

**Write what the eye must read first.** Name the first, second and third
landing your figure wants, and check the source's own three for a workable
order — usually the band titles and the main flow, sometimes a single rule
panel. The landings belong to the method's moves and to the statement the
reader must retain; a glance that lands on a mascot, a miniature or a slogan
has the hierarchy inverted, whatever the words say.

**Write what makes a figure look template-made.** Every panel the same size
regardless of what it holds; every arrow the same weight; a legend that
explains what the eye already understood; icons from a set; a colour per panel
with no role; text centred in every panel; a title inside the figure that the
caption already carries; clip-art where the
method's real output would say more. Judge the figure in front of you against
these.

**What is left alone.** No panel for the input where a small glyph and a line
do; no label on the main flow; a band with two panels when two are what
happened; margins nobody filled. These are the cheapest wins in the work —
until a reader needs something there. Emptiness is protected by what it does
for the reading, never by the source having had it too.

**Illustrations.** The source's mascots, characters, drawn scenes and
generated thumbnails are its content, not its craft; never take them. Choose
each panel's illustration for what the reader must understand there: a real
crop when its visible content explains that step at reading size, a drawing in
the chosen identity's own line when the panel needs to identify an actor, an
artifact
or an operation, and nothing at all when the only thing gained is another
miniature. The source's thumbnail count is not a requirement. Nothing in the
figure is generated by an image model, and nothing is drawn to look like one.

**Text and title.** Does the source carry a title inside the figure? A
README hero does; a paper's Figure 1 usually does not, because the caption
carries it and a second title is the first thing a reviewer of the paper
strikes. Decide from where your figure will live, and write the decision
down.

**Composition.** How many bands, the reading direction (left to right along a
row of bands; or top to bottom, one band per row; or a column of stages with a
loop returning up the right edge), the ratio of panels to ground, where the
loops cross the bands, where the legend and the rule panel sit and why there.
For the source's own method: if the aspect cannot be kept, preserve the bands,
the loop crossings and the bottom row deliberately and record which you kept
or merged. For a method transfer: borrow the source's rhythm where it serves
the method (three bands in roughly 30/40/30 of the height, the loops crossing
between bands two and three, a bottom row for legend, rule and output) and
change it where it does not — ALIGN merged the source's three-part bottom row
into one showcase strip and moved the rule panel up beside band 3. The panels
come from the method.

**For a method transfer, write the specification before any code.** Draft
`wiki/method.md`: the relationships the reader must be able to recover,
numbered and in order — each one sentence — and the facts the figure must
state (which model sees what; what crosses a round and what does not; a count,
a limit, a score trajectory); which illustration each panel
carries and why that one; what the rule panel must state. Then `wiki/plan.md`:
bands with their y ranges; panels per band with x ranges, family and
illustration; every line with its kind, source, target, label and the band it
crosses; the legend entries; the output presentation; the rules every module
obeys (the blank list, the word budget, the type scale and its floor, lines
attach at panel edges, randomness resolved at build time). Beside it
`wiki/interfaces.md` is the module contract when there are modules: the
shared layout object, the primitives a module may call, what its build
returns, the occlusion order. The user names what must be on the figure
here — for ALIGN, the blind reviewer, the wiki, and the fact that no pixels
cross rounds — and each named element gets its place in the first glance.
Whether the figure says what they meant is theirs to judge.

**Borrowed technique.** If the user hands you a file that already does one
thing well (a previous figure's arrow-routing around panels; a scrub UI; a
band-tint scheme), read it and write a `## Borrowed` section naming the idea
you take. Take the idea, not the file.

Then set **CRAFT_CLAIM** in one sentence at the top of `reference.md`.

## Phase 1 — Plan the architecture and choose the views

### Replay units

Represent the figure as ordered replay units whose granularity matches the
build: a band, a panel, an arrow, an illustration placement, a text run, a
legend entry — whatever the visible designer's action is. Each unit belongs to a
stage and carries every choice it needs — position, size, radius, colour,
weight, dash, label text, font size, the routed path of an arrow — made when
it is built. Its draw function makes no fresh random or compositional choice;
it may read the stable shared layout, the panel rectangles and the stage state
established at build time. If any randomness exists (a seeded dash length, a
hand-set-looking offset), resolve it at build time; most figures need
none. Order units by the real action: left to right within a stage in the
reading direction, band by band; arrows in the order main flow → loops →
traces; text after every shape it sits on.

The same units feed both renderers: the P2D canvas the page replays and the
review screenshots come from, and the p5.js-svg renderer that writes the
paper's SVG at full progress. A unit that draws differently in the two — a
blend mode, a canvas filter, `drawingContext` work — is a unit the paper
will not get; keep to fills, strokes, text and images.

### Occlusion as the designer produces it

Bands go under panels; arrows go over bands and under panels, so an arrow ends
at a panel's edge and its head is never hidden inside — route the path to the
edge at build time rather than drawing to the centre and covering the
overlap. Crops are clipped to their reserved rectangle. Text goes over
everything and never touches a stroke. A loop crossing a band it does not
belong to crosses in the gap between panels or takes the margin — the
arrangement you borrowed usually shows a workable answer. Write the order into
`wiki/plan.md`; occlusion is settled once, there.

### Module owners against the contract

A figure is usually one program. When it has materially different families —
a band layout, an arrow router, an illustration set, a legend — and more than
one pass is needed, give each its own module with one owner building against
`interfaces.md`, self-rendered once in a harness before integration; the
integrator composes and owns `plan.md`'s rules. Owners work in parallel because the contract, not the
integrator, answers their questions. Do not split what one pass can hold.

### Presentation

One view: the whole figure at CANVAS size, shown at its display width on a
page with play/pause, scrubbing, direct access to the stages, and deep links
to a progress value (`#p=…`) and to the end of a stage (`#stage=3`) so a stage
can be shared and the headless render can hit it without guessing a progress
value; no viewport and no `#cam=`, because the figure is seen whole or not at
all. Replay directly — a figure has hundreds of units, not tens of thousands,
and it stays responsive. Pace
stages by the amount of visible work — the bands go down in a moment, the
arrows draw at a rate the eye can follow, the text appears word by word or
panel by panel — but keep the order.

An **Export SVG** control calls `save()` on a p5.js-svg instance built from
the same units at full progress (inside the claude.ai artifact viewer, where a
page cannot start its own download, hand the SVG over through the `downloads`
capability instead); the same instance renders when the page is opened with
`#svg`, into an inline `<svg>` and nothing else in the body, so a headless
browser can dump it. Load p5 **1.9.4**, then p5.js-svg **1.5.1**, then the
sketch; `createCanvas(w, h, SVG)` for the export instance, `createCanvas(w,
h)` for the replay. That pairing does not work on its own: p5 1.9's transpiled
`Renderer2D` constructor returns a *new* object which p5.js-svg discards, and
svgcanvas has no `ctx.ellipse`, so the page needs a small wrapper above the
sketch before `createCanvas(…, SVG)` will run;
`examples/align-figure/figure.html` is a working p5 + p5.js-svg page whose
wrapper handles both faults.
The SVG's text stays text — the paper's authors will edit
a label in Illustrator — and the thumbnails embed as images. For a
non-page deliverable, expose the ordered stages in the medium's natural form:
SVG groups per stage, in build order.

### Fonts

Before drawing any text, load the complete final string in the chosen face
(`document.fonts.load(font, fullText)`) — web fonts arrive in on-demand
subsets, and a load without the text leaves rare characters and CJK to fall
back to a system sans. Render the string once and look for fallback glyphs.
Use a face available to the headless review render, to the page, and to the
paper's build, which will resolve the SVG's `font-family` itself: a face the
PDF pipeline has (Helvetica, Arial, or one the paper already embeds) or a
web face whose fallback is visually faithful. Inspect typography in the
intended publication and fix visible substitutions.

### Views for the blind gate

The **reading view** is the whole figure at the width where its reader will
meet it, and the reviewer's explanation of the method comes from it alone,
before any enlargement. State that width separately from the export: an
1800-pixel canvas displayed at 900 CSS pixels is read at 900.

**Diagnostic crops** go where the reading view cannot resolve the
construction. The densest band is usually one of them; a rule panel, an output
sequence or a caption may need another despite being sparse. Keep a crop stable
while its subject is stable, recut it when a redesign moves that subject, and
send every crop you chose — the round's prompt lists this round's views, not a
list frozen in Phase 1. ALIGN's run cut a bottom crop and then left it out of
two prompts while the rule panel and the showcase were being redesigned; both
were judged from the reading view alone for two rounds, and the painting runs'
lesson stands: 黄鹤楼, 300 px tall, stood unseen between two viewports for eight
rounds because no view was cut for it (D-17 of the 武汉 run).

The **process sheet** — one labelled panel per stage, the whole figure at
reduced size after each — goes to the first construction review and again
after the replay sequence changes. Once the sequence is settled, leave it out:
in the ALIGN run the same naming objection recurred in five rounds, and the
sheet was needed only initially and after the v3 redesign. Enlargements
diagnose construction; they set no finish standard beyond what the delivered
figure shows.

### What a pass means

Resolve drawing choices at build time so replay and export use the same units.
Looking at the exported SVG beside the PNG for breakage — a dropped thumbnail,
a label in the wrong face, a stroke scaled wrong — is hygiene, not a gate.

*Blind pass:* accept the independent reading when it recovers the promised
account, judges the work plausibly CRAFT_CLAIM, and leaves no visual problem
worth another redraw. A blind pass requires an independent reading of the
*delivered* version; your own look at your own figure is hygiene, and a budget
or a user stop may end the run without one.

*Human pass:* the user accepts the rendered figure after handoff; every element
they named is on it where they wanted it.

A directional 0–10 may be recorded per round to read a trajectory; it is part
of neither pass, and a trajectory restarts when the reviewer model changes.

## Phase 2 — Draft

Derive each primitive from the grammars written in Phase 0. A panel is its
family's shape at its content's width, not a rectangle plus a style. A line is
routed from edge to edge with its kind's weight, colour, dash and head, its
label placed where your grammar puts labels of that kind. A crop of a real
file is cut to its reserved rectangle at build time, never scaled
non-uniformly. A text run is one of the sizes you set.
The ground carries nothing that has no role. Inspect the changed passage at
reading size and enlarge it when its construction needs examination; correct an
obvious new artifact (a label riding a stroke, a head buried in a panel, two
tints reading as one) before the blind round. When parameter changes leave the
same tell in place, replace the primitive.

**Working method for a module owner — and for the single owner most figures
have.** Write a skeleton — the layout object, one band, one panel, one arrow,
one text run — within the first few tool calls, render it, and keep building
from something you can see; the code is the design. An owner who tries to
design the whole arrow router with every crossing case before writing a line
produces thinking and no file. Keep each module's scope to what one pass can
hold; split the rest into a second module.

**Let one thing recur.** Carry a recognizable artifact through the panels
where the method carries that artifact, keeping its identity while showing the
operation or state each panel represents — it explains transformation without
buying another label. Distinguish the reference from the produced work when
the method transfers technique rather than content: in ALIGN's figure the
framed 绢 window recurs everywhere, but the source's mountain stays in the
source-side windows and the work's own bridge appears in every work-side one,
two panels away from 取其法,不取其景 (D-25). For a sequence, choose changes
broad enough to survive reduction; more tiny marks do not explain a new
state.

### Calibration — what one figure run settled, and where to start the next

Two sources for the numbers below: one composition source read at 1800 px
(ARIS-Movie-Director's Figure 1) and the ALIGN figure run that borrowed its
arrangement. The ALIGN numbers are a recorded instance, not a law — judge these
starting values at your display width, on your ground, in your faces. The painting runs'
observations are causal and transfer where the mechanism is the same. A
D-number named with a run — the 武汉 run's D-20, the 千里 run's D-18 — is in
`examples/qingming-wuhan/wiki/decisions.md` or
`examples/qianli-process/wiki/decisions.md`; a bare D-number is the ALIGN figure
run's own wiki; a B-number is a blind round in the 武汉 run's `review-log.md`.

*Bands.* Numbered regions, each with a title at the largest band size. They
read as regions only by contrast with the gaps between them, judged at
reading size on the ground you actually use — the source's three pastel tints
and ALIGN's one deeper silk tint under all three bands both work. A band's
height follows the tallest panel in it plus the title, not a fraction of the
canvas; bands that are all one height are the first template tell.

*Panels.* One corner treatment across the figure; one outline weight per
family, drawn in the identity's own line. Title at the middle size, a one-line
subtitle under it, the illustration area under that — sized by what the
illustration has to explain, not by a share of the panel: ALIGN's band 3 stayed
unreadable until it grew to about 190 px, with panels about 130 px tall and
larger illustrations in them (D-19). Panel width follows content: the source's
`Outline` panel is half the width of `Asset Library` because it holds one line
and one small icon. What tells a gate from a step is whatever your identity makes legible —
a diamond in one idiom, a doubled 界画 rule in another. ALIGN's v2 drew its
diamond at about 300 × 192 where the source's is about 200 × 165, and defended
the enlargement with the source's own grammar (D-12); the user threw it out
with the rest of that identity. A
subtitle that wraps to two lines is a subtitle that needs cutting.

*Lines.* Main flow: the heaviest weight (about 5 px at 1800 wide), filled
head, unlabelled, horizontal wherever the layout allows. Retry loop: an
accent, lighter (about 3 px), routed below the panels it returns across,
labelled at mid-path with its condition and its limit. Repair loop: a second
accent, dashed, crossing a band gap vertically. Audit trace: the thinnest and
palest, with a small head. Each of those weights is a contrast claim against
the ground — the source's 1.5 px grey read on white, and the same line in 淡墨
on silk went to 2 px at α 0.6: its route had been read correctly from the
legend for three rounds, but the stroke itself was too weak to see (D-17). A
head that ends under a panel was the walls-not-in-the-mask bug of the 武汉 run
in another costume: the reviewer named the symptom in round 1 and the executor
fixed nine other things first (D-20). Route to the edge at
build time.

*Illustrations.* Size each by what it must explain. Three version frames at
44 × 30 px carried "increasing density" and nothing about what changed, and
came back larger and more visibly different (D-19). A crop that is
itself a figure with its own labels becomes noise at reading size; crop
tighter, or choose the passage whose structure survives. One large example
often explains the output better than several small ones — ALIGN ended with a
single uninterrupted panorama of the method's own product along the bottom
under one caption, after twelve small screenshots were thrown out. Embed crops
as data URIs at build time so `file://` rendering, the SVG export and an
artifact host all see the same bytes.

*Type.* The floor comes from the display width, not from the export. ALIGN
settled on 52 / 36 / 28 / 22 px on an 1800 px canvas displayed at about 900
CSS px: four sizes including the title, 22 as the floor, with 楷 headings over
humanist sans supports doing work that size alone had been asked to do — the
argument that a 22 px floor would collapse the hierarchy held for two rounds
and stopped holding the moment the faces changed (D-04, D-14). Around seventy
words. Labels sit beside their line, never across it, in the line's own
colour.

*The character of the marks.* Typeset the labels for reading and construct the
marks around them in the chosen visual identity: a calligraphic heading, an
ink-line illustration, a brush arrow all belong when they express the
identity. Keep alignment and glyph structure deliberate. Material character
comes from how a mark is built — pressure, taper, edge, join — never from
jitter applied to an otherwise generic line. The painting runs' lettering
lesson transfers unchanged (D-18 of the 千里 run): a reviewer asked for tilt,
wander and warp to make writing look hand-made, the user's first look was
「这个字怎么歪歪扭扭的」, and all of it came back to near zero.

For a brush arrow that means one closed filled outline — a deliberate entry
(the 顿), a pressure-shaped body that still breathes at 3 px, and a taper that
runs into the head, so shaft and head are one gesture. Carry the pressure
through a turn: a corner is a 折, a press over a small radius, not a pipe bend
at constant width. Give each dash a direction, 顿 at its start and a point at
its end, so a dashed run travels one way. Judge the gesture at reading size
before refining its enlarged contour. A chain of short stroked pieces produces
visible segmentation, and small random changes of width do not produce
brushwork (D-16 and its two amendments). Panel rules, ticks and the scrubber
stay steady where their function calls for it.

*Legend, rule panel, showcase.* The legend lists the line kinds, one sample
stroke and a label each, in the lightest outline in the figure. Give the rule
panel an operational job — the condition or distinction the reader must retain
— and make that statement primary. A slogan may support it but has to earn its
space and weight: ALIGN's 「a loop can DRIVE, cannot ACQUIT」 stayed too
prominent — v5's reviewer read the stop condition and still asked to make it
primary — and the run ended with the stop line primary and the slogan a note
beneath it. Include a comparison only when the difference and its
consequence are visible at reading size; ticks, crosses and decision numbers
cannot supply grounds the picture does not show (D-05, D-11, D-18). Remove an
example when a required statement needs its space (D-24). Choose the output
presentation on its own merits rather than from the source's release strip:
give a continuous image one unambiguous caption, say what its counts and score
trajectories measure, name a second example explicitly if the text mentions it
(D-21), and show successive versions where the method explains iteration.

*Title.* The destination decides. A README hero usually carries a title strip
inside the figure at the top left, largest size, with a one-line tagline under
it; a paper's Figure 1 usually carries none, because the caption does (the 千里
run's D-02, the title written into a picture that never carried one, is the
same decision). A slide is its own case.

*Ground.* From the identity, with a role. In ALIGN a flat silk-coloured page
(#d9cbb0), one deeper silk tint (#cdbc9c) under all three bands, pale paper
panels and pigment accents carried the project's identity; woven texture was
unnecessary — the silk is a colour, not a raster. "Silk everywhere" would be
the same mistake as "white everywhere". Nothing sits on the ground without a
role: the painting runs' large translucent polygons and soft stains read as
screen lighting (B1, B7–B9 of 武汉), and in a figure a drop shadow or a gradient
fill usually does the same — judge each against the chosen identity at reading
size, and take out what only decorates.

## Phase 3 — Render, hygiene, and the optional source round

Render this round's views headlessly with whatever browser is installed,
driving the page's own progress control through its deep link. For Edge or
Chrome on macOS the reading view is:

```bash
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new \
  --disable-gpu --hide-scrollbars --window-size=1800,1000 --virtual-time-budget=<SETTLE_MS> \
  --screenshot="$PWD/review/whole.png" "file://$PWD/figure.html#p=1"
```

Add `--force-device-scale-factor=2` for a 3600 × 2000 render and cut this
round's diagnostic crops from it; when the process sheet is due, render
`#stage=1` … `#stage=<n>` and tile the panels into `process.png` with the
image tool at hand.
The SVG comes from the same page:

```bash
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new \
  --disable-gpu --virtual-time-budget=<SETTLE_MS> \
  --dump-dom "file://$PWD/figure.html#p=1&svg" > review/figure1.svg
```

and the `<svg>` element is the file once the document wrapper around it is
trimmed. Set SETTLE_MS from the observed build and font-load time. Use
`file://` only for a self-contained page; if the page loads modules, fonts or
crops through requests, render through the project's existing local preview
URL. If the deliverable is artifact HTML without a document skeleton, wrap it
in a minimal `<!doctype html><html><head><meta charset="utf-8"></head><body>`
for the preview. Crop, tile and diff with the image tool already at hand;
add no helper to the project for this.

Inspect the rendered figure and the SVG for visible breakage, particularly
where this redraw changed their construction: a blank canvas, fallback glyphs,
a missing band, a label over a stroke, a head under a panel, a thumbnail
stretched or absent, a crop that does not show what its label says (the
painting run's B2 caught a reference detail cut on the wrong passage). Fix
breakage before the reviewer sees it. Inspect your own work for reading and
beauty as well — only the independent reviewer's reading can establish a blind
pass.

**Source round, only if needed, only before the first blind round.** When a
concrete implementation uncertainty remains that pixels cannot answer —
whether the SVG and the canvas come from the same units, whether a choice is
made at draw time, whether the export instance shares the layout object —
ask the reviewer to read the source in a separate thread, with the paths and
the scope block. In the 千里 run two such rounds found randomness inside draw
closures and a wrong colophon date; in a figure the equivalent finds are an
arrow routed at draw time and a label that misstates the method. Fix what
affects the figure or the process, then begin the blind rounds. This is not a
visual gate and is not repeated once the issue is settled.

## Phase 4 — Blind review

Fresh reviewer thread, read-only, prompt naming only image paths. Nothing about
the algorithm, nothing from `method.md`, and in round 1 nothing from the
composition source. Request the reading with the whole figure alone; after the
answer comes back, send the crops, the source and the previous round's
observations in the same thread. The scope block travels verbatim in both.

```
First call — the reading (mcp__codex__codex, or your reviewer's equivalent):
  sandbox: read-only
  cwd: <PROJECT_DIR>
  prompt: |
    Blind figure review, round <N>, part 1. Judge only from this image; do not
    read source or any text file.
    - <PROJECT_DIR>/review/whole.png     (the whole figure, <W×H>, read at
      <display width> — every judgement about size is at that width)

    The work is a method-overview figure: <CRAFT_CLAIM>, read at <display
    width>, built in the order <stages>. You have not read the paper. Explain
    only what the figure shows.

    1. Explain the method in the order the figure reads: who acts, what passes
       between steps, what each decision changes, what persists through a loop,
       what ends it. Put "unclear:" in front of any sentence where the figure
       leaves you unsure. Do not fill gaps from what such methods usually do.
       Then state the counts, limits and trajectories the figure claims. Take
       the space this needs.

    <SCOPE LIMITS, verbatim from below>

Second call — same thread (codex-reply, or your reviewer's equivalent), after
question 1 is answered:
  prompt: |
    Round <N>, part 2. Now open the rest:
    - <PROJECT_DIR>/review/<crop>.png    (…one line per diagnostic crop chosen
      this round: which passage, at what magnification)
    [First construction review, and after the replay sequence changes:]
    - <PROJECT_DIR>/review/process.png   (one labelled panel per build stage:
      <this figure's stages, named>)
    [Round ≥ 2 only:]
    Composition source — the arrangement the work borrows, at the same reading
    size. Do not revise your answer to question 1 from it.
    [风格迁移:] It shows a different method; compare arrangement, grammar and
    hierarchy only, never content. The work's palette, materials and marks are
    the chosen identity, decided by the user: judge their execution, never
    their distance from the source.
    [意临:] It is the published figure of the same method; compare craft only.
    - <STYLE_WINDOWS>/whole.png          (the source figure whole)
    - <STYLE_WINDOWS>/<window>.png       (…one line per 2× window)
    [Round ≥ 2:] Unresolved observations from round <N-1>, quoted:
    <paste them verbatim>
    Visible change made for this round, in the designer's terms:
    <one sentence, such as "the repaint loop now leaves the store from its
    bottom edge, runs under band 2 and re-enters the program panel from below,
    with its condition written at mid-path"; no parameter values>

    Answer as a reader of the paper and a designer of figures would:
    2. <At its destination — a README hero, a paper's Figure 1, a slide>: is it
       worth looking at? Where does the eye land first, second, third; does the
       distribution of weight and space serve the method; what one change would
       most improve the whole?
    3. What reads as template-made rather than designed for this method,
       ranked by how much it hurts the craft claim. For each: what you see and
       the one change that would help most, and whether that change looks like
       a parameter of the present construction or a different construction —
       say what you see that makes you think so. The images are at <px scale>;
       give numbers where that scale makes them reliable.
    [Round ≥ 2:] 4. Say which earlier problems still warrant a redraw.
    [When process.png is supplied:] 5. Does each panel add only what its stage
       names, and is the build order plausible for a designer of such figures?
       Name the stage and the visible mismatch when it is not.
    6. Which passages hold at reading size — name each and say what function
       it carries that must not be lost. [Round ≥ 2:] Beyond the quoted
       observations, what other tell is now material enough to affect the next
       redraw?
    [Round ≥ 2:] 7. Beside the composition source, arrangement only: which of
       its conventions does the work keep (band grammar, panel families, line
       kinds by meaning, hierarchy, text density, where the eye lands first),
       which does it break, and does each break help or hurt the reading? Say
       nothing about how the two methods compare and nothing about the work's
       palette or materials.
    [When the user has named a whole-figure quality and measurement helps
       choose the change:] 8. <the measurement: "the source carries 68 words in
       three sizes; the work 94 in four">. In the designer's terms, where does
       the difference come from and what would the designer do about it?
    [Optional, for trajectory only:] 9. One 0–10 for "a reader explains the
       method correctly from this figure alone". The number does not decide
       whether the gate passes.

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

Read the reply as a colleague's opinion. Compare the reading with the promised
account, repair what it misses, and keep only the observations the next redraw
needs — for each, one short reviewer sentence quoted verbatim in
`wiki/review-log.md`, with its parameter-or-primitive call, since that quote is
what the next fresh thread receives. Do not archive the raw reply.

Rules for using it:

- **The explanation is the gate; the tells are the second gate; the number
  is neither.** The reading recovers every promised relationship and stated
  fact; questions outside that scope do not block acceptance. A round whose
  explanation does that has passed the reading test whatever the score says; a
  round whose explanation skips the audit trace has not, however clean the
  figure looks. A score from a different reviewer model is a new baseline,
  and round 1's score, given without the composition source, is not comparable
  to round 2's — in the 千里 run the number fell from 5.8 to 4.0 the round the
  reviewer first saw the original; nothing had got worse. A score across an
  identity change mixes conditions the same way: ALIGN's fell 6 → 5 the round
  the figure became ink on silk. Read the observations to find what actually
  got worse, and do not let one number carry the diagnosis.
- **Send each disagreement to what actually decides it.** Is the observed
  feature the method's account, the chosen identity, the arrangement you
  borrowed, or your implementation? "Add a legend entry for the audit trace"
  loses to the word budget when the trace's own label carries the meaning;
  "this panel should say what the reviewer sees" wins, because the figure's
  scope promises that fact and no panel said it; "make the gate a panel like
  the others" is answered by what tells a gate from a step in your identity,
  not by what the source happened to draw. Record it when it constrains later
  work; reopen it only when later pixels supply new evidence.
- **Tell a reading failure from a request for expansion.** Read an `unclear`
  against the account the figure promised. Decline requests outside it — a
  reader may go on wondering about an implementation detail the figure never
  offered — and repair missing relationships within it. The reviewer's preferred
  extra label is only a suggestion and the budget may refuse that remedy, but a
  missing required meaning still has to be drawn.
- **Its ranking is the gate; its remedies are suggestions; the passages it
  says hold are the positive gate.** "The three loops need to be told apart at
  a glance" is a direction; which weight, which dash and which colour are
  yours. Protect the *function* those held passages carry: when the user
  changes the craft claim, carry the functions into the new construction —
  their old shapes and materials need not survive, and a lost function is
  repaired inside the accepted identity, never by restoring what the user
  rejected. Treat the parameter-or-primitive call as a hypothesis about the
  visible failure: inspect the construction you have before choosing, and if
  it already has the structure the reviewer proposes, repair the part that
  fails rather than rebuilding it under a new name.
- **It can misidentify the object.** A reviewer that calls the wiki panel "the
  loss" has told you the panel's title fails, not that a loss is missing; a
  reviewer that reads the repair loop as main flow has told you the dashed
  line is too heavy, not that the flow is wrong. The 武汉 run's B5 prescribed
  a roof for a boat that was a barge and B6 corrected it (that run's D-14);
  quote the self-correction back in the next prompt and fix the object the
  reviewer meant, not the one it first named.
- **The user's look comes early and names things the reviewer cannot.** Show
  the first complete composition at its intended reading size — actual ground,
  type, mark character and output treatment — before polishing it through
  blind rounds, and show every substantial identity or hierarchy change when
  it is made. They judge in a glance whether the figure says what they meant
  and whether it looks like the chosen visual identity. An explicit ruling
  rewrites the craft claim and the plan immediately, and the reading review
  continues inside that direction. When they name a whole-figure quality — 「太满了」,
  「看不出哪条是回路」 — address it; measure it when the measurement helps choose
  the change, and put the numbers to the reviewer as question 8 when a
  designer's prescription would beat your own.

## Phase 5 — Decide, in writing

Record decisions that constrain later work or explain a reversion, in
`wiki/decisions.md` — numbered and dated, with the observation that told you
so. When a ruling changes the design, update the affected instructions in the
current plan and keep the old choice and its reason in `decisions.md`: a
resumed owner must meet the current direction directly, not reconstruct it from
a debate. ALIGN's plan still described an eave overhang, a segmented brush and
rule examples that three decisions had already replaced.

## Phase 6 — Redraw

Redraw the smallest **complete relationship** that failed — its labels, its
geometry, its illustration scale and the space around it in the same change.
A figure's parts are coupled: fixing a label while its panel stays too small,
or a route while the words that explain it stay elsewhere, buys a round and
resolves nothing. When identity or hierarchy changes, redraw the affected
composition as a whole; keep local polishing for a figure whose reading
structure already holds. Finish each round by inspecting your own work for both
reading and beauty; only an independent reading of the delivered version can
close the gate.

A figure wants fewer, larger rounds than a painting: a complete composition
shown to the user early, a coherent redraw of the reading and the visual
hierarchy, a finishing round, an independent reading of the delivered version.
A further round needs an actual unresolved change, not a slot in the budget.

**When local fixes leave a required relationship unclear, redraw the
relationship** — its actor, its endpoints, direction, condition and
destination, with the space and the words it needs. A shared record does not by
itself explain what different decisions do; a source's omission is no reason to
leave a required handoff implicit. ALIGN waited a round, added a small booklet,
declared the matter closed, and the user's final ruling bought explicit roles
and routes anyway.

A primitive change usually overshoots on the first try (the first re-routed
loop crosses two things it did not cross before; the first split panel breaks
the band's rhythm): inspect the changed passage at reading size, enlarged where
its construction needs examining, before applying it across the figure. Revert
a failed construction when the previous one still serves the accepted
direction, and apply only the minimal fix named (the 武汉
run's D-13, trees v5 → v6, taken back in one round). When the user has
replaced that direction, repair the failed function inside the new one
instead: a lower score after an identity change is not an instruction to
restore the rejected figure. Keep the process animation truthful as primitives
change — if lines are now routed edge to edge, their stage shows them growing
edge to edge in reading order, which it will if units are sorted.

Immediately after the redraw, append one terse line to `review-log.md`
naming the visible change and saying the new render awaits blind review; this
is what lets a later session tell changed-but-unreviewed code from an
unapplied review.

Render every applied round to the same local entry path and export the SVG
beside it, so the trajectory is easy to inspect and the paper can take any
round's figure. If the environment already has a publication path (an artifact
host) and the user wants to watch, publish each round to the same URL with the
round as its label. The first complete composition goes in front of the user
before it is polished, and every substantial identity or hierarchy change goes
in front of them when it is made: theirs is the only look that knows what the
figure was meant to say.

Then Phase 3 again.

## Resuming after a break or a context reset

The wiki is the state. Read `reference.md`, `method.md`, `plan.md`,
`interfaces.md` when it exists and `decisions.md`, then the last entry of
`review-log.md`; open the current render.

**Before the first review exists** — `review-log.md` has no round, so the break
fell inside the first draft — find where it stopped from what is on disk and
finish that phase from what is already recorded, rather than restarting it. No
`method.md` carrying the account a reader must recover, and no chosen identity
or reading width, means Phase 0 is unfinished. No plan naming the panels, the
routes and the words means the composition is unsettled: settle it and go on. A
page that renders its regions and panels but not its connections or its
illustrations means the build is unfinished. Carry it through to the first
whole-figure render, then show the user before entering the review loop.

If the last entry is a
review not yet applied, continue with its highest unresolved item (Phase 6).
If it is a redraw awaiting review, render and go to the blind gate (Phase 3).
Do not re-run a blind round on an unchanged figure, and do not re-research a
settled decision unless the current image contradicts it. Reviewer threads do
not survive a break and need not: every round starts fresh and receives the
previous unresolved observations quoted.

## Stop, and hand over

Stop the automated rounds when the blind pass is met, when ROUND_BUDGET is
spent, or when the user says so; then perform the human handoff. Where the host
has no separate vision-capable reviewer, there are no rounds to stop: hand over
at the first complete figure, say plainly that it is an unreviewed draft, and
name the relationships you would put to a reviewer first. Hand over the
page, the exported SVG and the 1× PNG, a one-line launch instruction when
needed, and the project directory with its wiki; state which version received
independent review, whether it passed, and any material problem still
unresolved. Then put the figure at reading size in front of the user. The
result is complete when the user accepts it; a visible failure they name
becomes the next redraw when a round is available. Do not describe the figure
as self-explanatory when the log says otherwise.

## Worked example — ALIGN's own Figure 1

**The identity question was never asked.** The first craft claim took the
source's identity with its arrangement, and v1 and v2 polished it before the
user replaced it with the project's own — silk ground, 楷 headings, brush lines
(D-14). Two versions inside a rejected identity is what that cost.

**Three relationships stayed unread to the end**: the handoff from the
specification into the loop, the verdict's three outcomes sharing one outgoing
path, and band 3's production link. Local substitutions carried them until the
user's finishing list after v5 bought explicit roles and routes (D-31).

**Where the run stands.** Seven versions; five blind rounds, 5 · 6 · 5 · 6 · 7.
v6 and v7 got the executor's own look and no blind thread, so the last
independent reading is v5's 7/10: the gate is not passed, and the figure now in
the README is one no reviewer has read.

## What this skill is not

Not an image generator, and it calls none: where a pipeline bakes a figure
with an image model from a blueprint and then verifies the pixels with
transcription scripts, this writes the figure as a program whose every mark
is already the specification, and lets a blind reader judge it. Not a
diagram DSL: no JSON layout spec, no auto-router — the program is written
for this figure in this arrangement, and the designer's build order is what
it replays. Not a checklist: the reviewer explains and judges, and the
executor decides in writing. Not a fidelity score: the optional number is one
reviewer's direction-finder. Not a substitute for looking: the user's look
opens it and closes it.
