---
name: align-video
description: ALIGN-video for Claude Code with independent Codex adversarial review. Create or revise a video through agent-authored code, rendering, editing and fresh-context audiovisual review, without image, video or music generation models. Use for reference-led animation, procedural films, motion design, explainers, construction replays, and continuing an existing coded-video project. Carries the work from reference study and animatic through a finished, reproducible film; supports explicitly requested self-review when appropriate.
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Skill, mcp__codex__codex, mcp__codex__codex-reply
---

# ALIGN-video — Claude makes the film, Codex challenges it

> The loop runs inside this task: make → render → watch → review → decide →
> revise. A changed film starts the next round. No scheduler is needed.

You are the filmmaker and the programmer. Study the reference, decide what the
audience should experience, and write the implementation that can produce it.
The deliverable is a watchable film with its working source. The source gives
you unusually direct control over geometry, drawing, motion, sound and editing;
use that control to make better film decisions. Keep returning to what the
render actually communicates.

This extends ALIGN's reference-art loop into time. A picture's composition now
includes the order in which information arrives, how long a viewer has to read
it, and what the next shot makes the previous one mean. A convincing frame can
belong to an inert sequence. A technically correct simulation can hide the
action that matters. Work on the sequence early enough that changing it is
still cheap.

Use prose to carry the creative reasoning. Choose the renderer, languages,
libraries and small utilities from the work at hand. Blender, browser graphics,
SVG, a 2D drawing library, a game engine and ordinary audio synthesis are all
possible means. An agent capable of implementing the film can also write its
own frame extractor or shot runner. This skill supplies the judgement and the
loop; it does not prescribe a Python framework.

The scope is general programmatic video: narrative animation, scientific and
educational explanation, product demonstrations, typography, abstract motion,
2D and 3D art films, seamless loops and construction replays. A new subject
needs its own visual logic. The worked film at the end is one case, not a
template of characters, materials, shots or tools to reuse in every project.

## Context and working commitments

Read the user's reference, subject, destination and constraints together with
any existing project. When the brief leaves a reversible creative choice open,
make a strong choice, state it briefly and start making something visible. Ask
only when the answer materially changes the film or an expensive commitment.
An authorized iteration does not need another permission question at every
phase. Honor a user-requested pilot approval when there is one.

Scale the workflow to the task. A short graphic loop may reach its full first
version in one small program; that version can serve as animatic and pilot.
A long narrative or a costly material transformation benefits from separate
stages. Apply the reasoning below where it changes a creative decision, combine
stages when that is more direct, and do not create a production department for
each heading. The invariant is a visible result followed by observation and
revision, with working source that can produce the result again.

**Agent-authored media.** Frames come from code-authored drawing, scenes,
animation and compositing. Compose or construct sound with ordinary synthesis,
editing, recordings or permitted libraries. Do not call diffusion or other
image, video, music or voice generation models, including to make a plate,
texture or new reference that is then traced. Language models can research,
write code and review. An existing reference film, even one made with a
generative model, can be studied as a reference. Existing assets permitted by
the brief can be used; record their actual sources and terms when you acquire
them. If the user wants everything procedural, that narrower brief controls.

**CRAFT_CLAIM** names what the film should look, move and sound like: for
example, materially convincing surreal CG with weighty mechanical acting,
paper cutout animation with held poses, or spare vector motion that explains
one mechanism. Deliberate CG is judged as CG. Stylized stepped motion is judged
against its chosen timing. “No computer-origin tells” is not a useful universal
standard for a medium deliberately made on a computer.

**PROJECT_DIR** is the supplied project, or a short descriptive directory when
starting from nothing. Keep the film, source, necessary assets and small working
notes there. Reuse its existing structure. In a new project, `wiki/reference.md`,
`wiki/plan.md`, `wiki/decisions.md` and `wiki/review-log.md` are convenient homes
for reference findings, current creative choices and unresolved observations.
Add `interfaces.md` only when modules actually need a shared agreement. These
are working notes that let the next session continue, not forms to fill in
before the first render.

**REVIEWER** defaults to a separate, vision-capable Codex reviewer while Claude
owns the creative work, source, renders and revisions. Each round starts a
fresh review context with no creator conversation or source. This is the
cross-family pairing; record the actual model used. Use the configured Codex
MCP interface or the equivalent reviewer connection exposed by the host.
Invoking this skill requests those reviews; it does not request a production
swarm or an unconfigured paid service. Inherit the operator's model and effort
settings unless the user specifies another. When the user explicitly chooses
self-review, or the host has no separate reviewer, continue the creative loop
as self-review and label it plainly. Do not relabel the creator's own look as
a blind response. Tool names in this file describe this installation's
capabilities; inspect the host's actual interface before calling them.

**ROUND_BUDGET** comes from the user. If absent, use up to four substantive
review-and-revision rounds, adjusting the render plan to the available time.
A round reviews a changed pilot or cut; local look-development probes are not
additional full-film reviews. An unchanged submission does not earn another
round. A user-specified number of completed versions takes precedence over this
default. Keep time for assembly and handoff rather than spending the entire
budget on the last render.

**REFERENCE_PASSAGES** are short temporal passages and still windows from the
exact reference, at the viewing scale that matters. **REVIEW_VIEWS** cover the
whole current cut and its consequential actions, not just attractive frames.
Keep corresponding passages comparable across revisions. Film timecodes, shot
names and neutral review filenames are sufficient identifiers.

For example: `/align-video <reference> → an original wordless short,
save in ./film, rounds: 4`. A request to continue an existing film enters at
its current stage; it does not restart reference research or replace settled
creative decisions.

## Doctrine

Let the reference teach mechanisms: how a form takes weight, how motion directs
attention, where the cut falls, how a quiet interval prepares an event. In a
style transfer, take those mechanisms into an original subject — 取其法，不取其景.
The user may instead ask for a study of the reference's own scene; state which
you are making. Either way, let the actual brief control the relationship.

Separate **film time** from **construction time**. Film time is what happens
on screen. Construction time is how you develop the work: masses and camera,
blocking, material behaviour, light, sound and finishing. Development stages
are your working method. A finished reference cannot reveal its actual
production process. If the requested film shows something being made, that
depicted process needs its own truthful order; revealing completed layers is
not automatically a demonstration of how they were made.

The highest-value edit changes what the audience can perceive. Before tuning
a parameter again, confirm the changed code reached the current rendered shot.
If it did and the construction cannot produce the needed behaviour, replace
the construction. Protect passages that already carry the film's character.
An independent reviewer supplies observations and challenges; the filmmaker
still makes the decision.

Follow [HERO](https://github.com/wanshuiyin/HERO-Anti-OverDefense/blob/main/RULES.md):
make the work, inspect concrete failures, and keep the remedy proportionate.
No automatic scoring bureaucracy, speculative compatibility framework, hash
registry or universal validation suite. A check earns its place by detecting a
specific failure that changes the next action. Write a helper when repetition
has become costly, then return to making the film. The scope paragraph in the
review protocol carries this restraint into each review.

## Phase 0 — Study the reference as something that happens

### Fix the source and the viewing situation

Open the actual reference and identify its edition, crop, duration and source.
Keep a usable local copy when available. Establish output aspect, duration,
frame rate and likely viewing size from the brief. Choose sensible provisional
values when unspecified. A phone-sized social clip, a projected installation
and a diagram embedded in a paper require different amounts of visible detail.
Use diagnostic enlargements to understand a material, then judge the result at
delivery scale. Compression and grain in an enlarged source are poor targets
for new geometry.

When no reference is supplied, choose a small coherent set of craft references
or derive a visual direction from the brief and render a first sample. A style
sheet, still artwork, object or diagram can anchor a video too; motion and
sound then need their own decisions. Do not stall waiting for a reference
movie. Record what each source contributes so a later review can distinguish
the brief's requirements from the filmmaker's chosen treatment.

Watch the reference through at normal speed with sound when the tools can
actually expose those modalities. Then revisit the moments that carry its
identity. A tool successfully opening or decoding an MP4 does not establish
that you perceived playback or heard its soundtrack. If the environment offers
only image viewing, extract an overview and short, densely sampled action
sequences; use audio tools where available, and record the missing modality
once. Continue making the film, and keep a playable preview for the user.

Choose reference passages for different jobs: a material making contact, a
camera revealing scale, an action crossing a cut, a passage of quiet, a change
of musical structure. Each temporal excerpt needs enough lead-in and aftermath
to explain the event. A single apex frame cannot specify acceleration or a
cut's timing. Retain timecodes into the original and a few still windows for
material and composition comparisons. Reuse these sources when a later review
disagrees with the craft.

### Describe causes, not a list of effects

Describe the visible vocabulary in words that suggest a construction. A wet
line may pool at its contact, gather into a rounded body, stretch and peel; a
rope, a thin membrane and relief spread across a wall need different geometry.
Identify the scale at which those differences survive. Broad highlights,
occlusion at contact and a changing silhouette may matter more than thousands
of small bumps.

Study the camera as an act of attention. Identify what the viewer learns at
the start of a shot and what has changed by its end. Notice when the camera
holds still to make an action legible, when it follows, and when a change of
view reveals something that was there all along. Record enough lens and
staging information to reproduce the effect, distinguishing measured facts
from inferred focal lengths. “Cinematic” alone does not tell you where to put
the camera.

Listen for the relation between sound and events. Structural accents, audible
attacks, rests, sustained energy and cuts are different things. Estimate tempo
only if it helps compose this work; do not assume every cut lands on a beat.
Look at how motion within a shot carries energy while the edit holds. A cut
detector, beat tracker or waveform can locate a passage worth inspecting;
inspect it before turning its output into a creative rule. Run measurements
to answer a live question, not to manufacture a comprehensive analysis report.

Write a short reference account: what carries the look, what carries the
motion, what carries the rhythm, and what the reference deliberately leaves
quiet. End it with CRAFT_CLAIM. If a crucial subject has a separate craft —
lettering, a portrait inside an animation, a specific scientific mechanism —
study that subject before proliferating an improvised design. Research current
facts or unfamiliar technical details from appropriate sources when needed;
settled local design decisions need no repeated search.

## Phase 1 — Find the film and give it a clock

### Write the change the audience should experience

For a narrative, decide what changes and why it matters: a machine that obeys
a grid encounters something small, chooses to spare it, and learns a new way
to draw. Establish the ordinary behaviour before breaking it. Let the payoff
answer something the viewer actually saw. For an explainer, identify the
misunderstanding the sequence resolves; for abstract motion, identify its
developing relation of forms, energy and rest. These are different briefs.
Do not force a character arc onto a loop, scientific animation or process film.

For factual explanation, first establish the mechanism and the states the
viewer must distinguish from the supplied material or reliable sources.
Derive the motion from those relationships: what moves, what remains fixed,
what changes in response, and what comparison makes that clear. Label an
intentional schematic convention when it would otherwise mislead. A beautiful
animation of the wrong mechanism is still wrong. For a product demonstration,
let the actual affordance determine the action and show the result of using
it. For a loop, compose the return as part of the movement from the beginning.

Write the sequence in terms of visible events. A useful shot has an initial
condition, a perceptible change and an aftermath the viewer can read. In acting
this often means anticipation, action and consequence. It is a reasoning aid,
not a requirement to put three beats in every insert. “The machine decides”
needs a visible means: the fitting looks, the body checks its movement, the
wheels find a new route. Put cause and effect in the same view when their
relationship is otherwise ambiguous.

Plan a reveal backward. If the ending assembles earlier marks into a face,
compose that face first, then derive the early marks, world layout and camera
concealment from it. A late reveal cannot be bolted onto unrelated geometry.
Check whether the intended agent could perform the implied work in the
available film time. When fantastical material takes over from a machine,
show the handoff. The audience can accept impossible physics when the film
clearly establishes its own cause and effect.

### Build one shared notion of time and space

Choose the time representation that fits the project. Absolute film seconds
with named events work well across animation, score and editing. Map an event
to frames from its own absolute time; repeatedly adding a rounded beat length
accumulates drift. Keep subframe time where motion blur or audio requires it.
Shots may use local time, provided the mapping back to film time is explicit.
Make cut ranges unambiguous so assembly neither repeats nor drops a boundary
frame. A tiny timeline file is useful when several consumers need it; there
is no required schema or event framework.

Give shared forms one description. A vehicle's route, its applicator and the
fresh line should agree on where contact happens. A floor plan seen close up
and overhead must be the same plan. Agree on units, axes, origin, scale and
time wherever modules meet. Let the shot own its camera and composition, and
make the ownership of lighting and post equally clear where they are shared.
Write these agreements only as far as actual collaborators or modules need
them. Separate agents are optional production help when requested or authorized;
sequential work uses the same agreements.

Introduce a scratch score or sound sketch early when sound carries the film.
Place the important silences and accents before polishing instruments. Permit
sound to lead an action, continue across a cut or linger after it. Freeze only
timings the user has fixed or that several finished passages now depend on.
Everything else remains editable while the animatic teaches you what the film
needs. A silent commission stays silent.

### Choose a way to make it that leaves room to revise

Select the simplest medium that can express the distinctive behaviour. A
constrained camera, authored deformation or 2D construction may make the scene
more controllable than a large simulation. Use simulation where its emergent
motion contributes something the shot needs. Try the actual renderer and
version on a representative frame; support for a camera model, motion blur or
volume is something to observe, not infer from a familiar setting name.

Measure a short moving passage with the intended material and post treatment.
Account for scene-build time, warm-up, memory, render and assembly when deciding
how much iteration fits. A benchmark of an empty scene cannot price a crowded
final shot. More render workers can compete for the same GPU and memory;
choose throughput from a small real run. Reduce detail that is invisible at
delivery size before sacrificing the action that makes the film work.

## Phase 2 — Cut the whole animatic, then prove the difficult passage

Make an end-to-end animatic early. Use rough masses, proxy materials, readable
poses, the planned cameras and scratch sound to produce the full duration.
Edit now. It should answer whether the viewer can follow the sequence, whether
the payoff has enough time, and whether any middle passage exists only to show
off an effect. A beautiful isolated asset cannot answer those questions.

Watch at intended speed and viewing size through available tools. Locate the
moments where attention arrives late, a cause disappears at a cut, a repeated
camera move becomes mechanical or a reveal resolves before it has a reason to.
Make the structural changes while the work is inexpensive. With only frame
viewing, examine short sequences around those events and state what remains
unobserved in playback. Keep producing a playable cut rather than treating a
contact sheet as the film.

Choose a **vertical pilot**: a short continuous passage that contains the
hardest interaction among action, material, camera, sound and finishing. Bring
that passage to approximately intended quality before multiplying its approach
across the film. If the main uncertainty is a transformation, the pilot needs
its onset, transition and settled form; if it is a diagram's readability, use
the busiest explanatory transition. Choose the passage for what it can teach,
not because it is the easiest to make impressive. An entirely different major
technique may deserve its own small probe, without becoming another production
pipeline.

Develop a representative material at the actual camera distance and in motion.
Try enough of the movement to expose contact, silhouette changes and temporal
noise. Compare viable constructions when the current one cannot produce the
needed effect, then commit to the stronger one. One resolved test is worth more
than a catalogue of unrendered possibilities. The whole animatic and the pilot
should now agree about timing and spatial relationships.

Show the pilot and current cut to the user while their response can still
change production. If the user explicitly reserved pilot approval, wait for
that approval before the dependent full production and continue useful work
elsewhere. Otherwise proceed within the authorized task, incorporating feedback
as it arrives. A missing independent review capability is not a reason to stop
after the first draft; continue with clearly identified self-review.

## Phase 3 — Give the film bodies, behaviour and sound

### Construct what the camera needs to see

Start each substantial module with a small working construction, render it in
its real context, and add complexity in visible increments. A module is ready
to integrate when it can make its promised contribution to a shot. Designing
every possible variant before making one often postpones the very evidence
that would change the design.

Derive silhouette, internal detail, material direction and deformation from
the same form. A stretched strip with a rolled edge will keep reading as vinyl
when its roughness changes. Paint that needs to read as wet may need an actual
spreading footprint, a gathered body and a lip that catches light. A branch
that must bear a load needs a convincing joint and motion through that joint.
Choose different constructions for materially different behaviours rather
than adding noise to one universal primitive.

Scale the detail to its role. A broad mass, a characteristic silhouette and a
single contact shadow often identify an object before its surface texture does.
Irregularity should have a cause: flow follows a surface, folds gather at a
constraint, worn areas follow handling. Independent random variation everywhere
erases structure. Purposeful repetition may establish a factory or rhythm;
variation belongs where the scene or material asks for it.

Choose equally specific primitives outside 3D material work. In drawn
animation, line identity, silhouette and deformation must survive changing
poses. In typography, hierarchy and reading time determine entrances and
exits; load the actual glyphs and inspect them in the delivered render.
In a scientific diagram, arrows, tracked objects and labels should share the
underlying state so a moving annotation cannot imply a different mechanism.
In a seamless loop, the boundary includes velocity, lighting and sound tails,
not just matching first and last appearances. Let the medium's real failure
modes guide the construction.

### Animate intention and consequence

Stage the subject so its acting survives the delivery size. Weight comes from
the relation between acceleration, support, delay and recovery. A vehicle can
look before turning, brake through its chassis and settle after contact;
simultaneous rotation of every part looks like a transform applied to a model.
Secondary motion should answer the main action. An edge may release before
the crown follows while the feet remain attached. Preserve contact where
contact is carrying the action's meaning.

Choose timing curves and holds for the performance. Distinct objects need not
all ease in and out together. A pause can make hesitation legible; too much
easing can make a decisive event mushy. For stop motion or drawn animation,
choose pose exposure and cadence intentionally while keeping camera and sound
coherent. Examine the transition, not only the beautiful key poses: a lifting
curve can pass through an unintended flat bridge between correct endpoints.

Make procedural state depend on film time and stable scene choices. Fix random
choices when building the scene or derive them consistently from object and
time identities. Redrawing a frame should not invent a new silhouette. An
authored animation may evaluate directly at arbitrary time; a simulation may
require cache or preroll. Use the history it actually needs. A split render
must produce the same performance as a continuous one. Sample animation at
subframe times when the renderer requests them so motion blur follows the
movement rather than a quantized pose.

### Let the camera and edit reveal the action

Compose for the important relationship. If an object gives rise to a stream,
show source, emerging front and trail together long enough to establish that
relationship. A fast chase can be exciting after the geography is understood;
before that it can hide the only evidence of cause. Use ordinary objects,
parallax, contact and atmospheric depth to communicate scale when the event
would otherwise read as a tabletop miniature.

Carry an action through the part the audience needs to witness. Cutting on an
impact may conceal contact; holding a little longer may reveal separation and
recoil. Compare both in the cut. Keep screen direction, eyelines, position and
motion across adjoining shots coherent where the viewer depends on them.
A deliberate disorientation needs an eventual orientation. Reframe a shot
whose subject is unreadable before adding lens distortion, shake or speed.

Vary shot duration according to what happens. Quiet and spectacle both need
time to be read; neither has to occupy a fixed number of beats. Use transitions
to carry attention, motion, shape or sound when the film asks for them. A
library of decorative transitions cannot supply a missing dramatic relation.
The ending deserves an actual hold at intended speed, including time to
recognize what it resolves, rather than a final frame visible only when paused.

### Make sound belong to this film

Compose a score with development, register and space around important events.
Programmed music can use ordinary synthesis, permitted sampled instruments or
edited recordings. Choose timbre by hearing it in the scene when audio access
is available. A formally correct melody in an unsuitable instrument can change
the film's entire tone. Synthesis complexity is not a substitute for a phrase
that supports the cut. If the brief includes speech, use permitted existing or
recorded speech and make its availability a real production dependency.

Give sounds perspective and a reason to occur. A mechanism's click, an impact,
a brush of contact and the room tone can explain an action more clearly than
another musical layer. Shape attacks and tails to the material. Let important
effects emerge from the music; leave silence or a sparse bed where attention
needs it. Preserve room continuity across cuts when the space is continuous.
Sound may bridge shots even when their images change abruptly.

For a chosen synchronization, compare the visible event with the audible
attack in the exported cut. The MIDI note start or waveform's largest peak
may not be the moment a listener perceives. Quantize image events from absolute
time and retain finer audio timing. Only events intended to synchronize owe
that relationship. Whole-film energy is not measured by the fraction of cuts
on a beat. When you cannot hear, distinguish structural checks of the score
and mix from a listening judgement, and leave the preview ready for listening.

### Finish in context

Light forms for their role in the composition. Metal needs something useful
to reflect; saturated material needs an exposure and view transform that keep
its identity. Inspect shadow, reflection and colour together before blaming
the shader. A nominal transition to sunlight that makes the subject harder to
see has missed its expressive job even if the scene's light energy increased.

Judge grading across adjacent shots. Grain, halation, depth of field, blur and
lens effects should support the craft at viewing scale. Keep enough raw output
to revise a shared finish without rendering geometry again when that pays for
it. A camera change may invalidate its old post treatment: a high normal-lens
view should not inherit distortion authored for a low chase. Check the final
encode, where grain, thin strokes, gradients and saturated edges can change.

## Phase 4 — Render the current cut and inspect what was produced

### Spend render time on the current work

Integrate completed passages into the animatic as you go. Render short probes
at modest cost for decisions about timing, geometry and framing; inspect a
representative passage at delivery settings before committing to the expensive
run. Temporary proxies are fine in a working cut when visibly identified.
They are not quietly substituted for unfinished revised shots in a final film.

Know which source and treatment produced each shot being assembled. Usually
shot directories and a short note are enough. When shared geometry, timing,
lighting or post changes, identify which shots depend on it and refresh those
outputs. Reuse unaffected shots deliberately. A render completed before a
shared edit can be internally valid and still belong to the previous film.
Do not build a dependency service to remember a relationship you can write in
one sentence.

After interruption, inspect the actual outputs before resuming. Complete only
the missing or damaged work that still belongs to the current version. A frame
filename can appear before its write has finished; hand post-processing a
completed render segment, using the existing tool's completion signal or
waiting for its writer. This concrete production hazard warrants a direct fix,
not an elaborate job-management layer. More complicated scheduling earns its
place only when this production actually needs it.

### Verify the failures this pipeline can produce

For a stateful effect or a workflow that resumes at arbitrary frames, compare
a short consequential passage reached through normal sequential evaluation
with the same passage from a fresh process using its intended cache or preroll.
Use the same settings and look at the difference. This detects changed random
choices, missing simulation history, accumulated draw state and time derived
from wall clocks. Render sampling noise is not a different performance. Test
the smallest passage that exercises the issue, record its scope, and repeat
only when a relevant change gives reason. A purely stateless simple animation
does not need an invented simulation test.

Before delivery, inspect the encoded artifact rather than assuming its source
frames guarantee it. Confirm the requested duration, aspect and frame rate,
that it decodes through the end, and that the intended audio is present and
aligned. Inspect the actual start, significant joins and ending for omitted,
duplicated or stale frames and unintended black or freeze. Intentional black,
holds and silence belong to the film. Add targeted checks for failures found
in this production; a synthetic test suite that mirrors the implementation
does not tell you whether the film works.

### Prepare evidence that lets someone judge a sequence

Keep a playable current cut as the primary review object, with sound when
sound belongs to it. Add an overview covering the entire sequence at readable
size. For the actions on which the film depends, provide short excerpts or
timestamped motion strips showing before, onset, transition and aftermath.
Include both sides of consequential cuts. Let dense samples answer a specific
question; evenly spaced stills may miss a very brief failure completely.

Use diagnostic enlargements for contact, materials or text, while retaining
the intended viewing size alongside them. Supply reference passages for the
same craft questions. If explaining the construction process is part of the
deliverable, show a few fixed film moments across development stages; label
them as development, not as the reference's unknowable production history.
A film about making marks must also show whether those marks arrive in the
depicted craft's order.

Choose images small enough to open reliably and large enough to answer the
question. Present manageable batches. Flooding a reviewer with full-resolution
frames consumes its context without recreating playback. When timing changed,
pair corresponding events in previous and current cuts rather than blindly
comparing the same timestamp. Preserve surrounding context so a local fix can
be judged for what it does to the film.

The creator's first look fixes broken renders, missing assets and mislabeled
views before independent review. It also catches obvious creative regressions
cheaply. It does not become independent evidence merely because the review
materials have been assembled neatly.

## Phase 5 — Review what a viewer receives

### Begin with an unprompted reading

Start a fresh reviewer context for every independent round. Keep it read-only
and give it only the supplied media, neutral viewing context and the review
request. Withhold source, storyboard, intended plot, decision log and the
creator's explanation. Use neutral filenames when a filename would reveal the
answer. A source or story consultation can be useful in a separate context;
it does not count as an unprompted audience reading.

First ask what happens. For narrative, what seems to cause what, what changes,
and how the ending relates to the beginning? For an explainer, what does the
viewer now understand? For abstract work, what progression do they perceive?
Ask for the moments that supplied that reading and the places they lost the
thread. Wait for the actual reply before supplying the intended subject or
craft comparison. This protects the useful distinction between “I saw it” and
“I can rationalize it after you told me.” A recognition answer based on sampled
stills is evidence about those stills, not proof that the reveal reads in its
allotted screen time.

Use a fresh Codex review thread through the interface available here. With
the Codex MCP server, the first request has this shape; substitute actual
accessible media paths and the appropriate audience question. Keep a neutral
review directory available if the normal project directory exposes the answer
in its name or automatically loaded notes.

```text
mcp__codex__codex:
  sandbox: read-only
  cwd: <REVIEW_DIR>
  prompt: |
    Work read-only. Open only the supplied media; do not read project source,
    notes, other agents' reports or surrounding files. Review round <N>.
    <neutral viewing context: duration, intended viewing size>
    <current cut path and neutral overview/action-strip paths>

    State which media you actually viewed and whether your tools exposed
    continuous playback and sound. Do not infer that from decoding a file.
    Describe one concrete event you observed, then tell me what happens in
    the film, what appears to cause what, and what the ending changes about
    the beginning. Name confusing moments with timecodes or supplied frame
    labels. Separate uncertainty in the film from gaps in your media access.
    Judge the supplied experience before guessing what its maker intended.

    Scope: report concrete problems in this film and say what already works.
    Propose direct changes to the work. No speculative infrastructure, hash
    registries, score rubrics, or repeated checks of settled issues. Do not
    manufacture a criticism to fill a category.
```

For a non-narrative brief, replace the story question with its audience question
above. Wait for the actual reply. Then send the craft prompt below through
`mcp__codex__codex-reply` using that returned thread identifier and the live
tool schema; an equivalent bridge may use a different continuation tool.
Continue the **same** context within the round. Start each new changed version
with a new thread. Calls are serial so the next message uses the actual prior
answer. Never count task submission, an error or a timeout as a completed
review. If the reviewer cannot open a supplied modality, provide the appropriate
alternative evidence and retain that limitation in the round's record.

### Then challenge the craft, motion and edit

Supply the reference passages, the stated intent, the current media and the
relevant prior excerpts. The reviewer can now compare craft and diagnose why
the intended experience does or does not emerge. Keep the prompt in the film's
own terms. Adapt this full prompt to the actual modalities and brief rather
than forwarding unused placeholders:

```text
Continue this round, read-only, from the media you can actually perceive.
The intended experience is <one sentence>. The craft claim is <CRAFT_CLAIM>.
The reference contributes <craft mechanisms>; the new film's subject is
<subject>. Judge the reference's craft, with scene likeness relevant only
where the brief actually asks for it.

Reference: <passage paths, original time ranges, still windows and scales>.
Current film: <cut/excerpts/views, version, viewing size, frame/time labels>.
Previous corresponding passages, when relevant: <paths and event pairing>.
Unresolved observations from the last round, quoted: <short exact quotes>.
Passages to protect: <what they accomplish, not their source implementation>.
Decisions settled from reference evidence: <only those relevant here>.
Visible change this round: <one sentence in screen terms, no code rationale>.

Rank the problems that most impair this film's intended experience. Locate
each in time, describe what you actually perceive, and propose the single
change with the greatest likely effect. Consider whether the cause belongs
to staging, construction, performance, camera, edit, light, sound or finish;
your diagnosis is a hypothesis about an implementation you have not read.

Follow the consequential actions through onset, transition and aftermath.
Where does the viewer lose cause, contact, weight, spatial orientation or
time to read? Where does a cut help, and where does it hide the necessary
event? Judge stylization against the craft claim. For a process depiction,
name any visible contradiction in the order or physical action being shown.

If you can perceive continuous motion and sound, judge the whole cut at its
intended speed: how its energy develops, where attention drifts, how sounds
motivate or obscure events, and whether the ending has time to land. If your
tools expose less, state the specific gap and limit these judgements to
observed evidence. A motion strip cannot establish playback fluency; a
waveform cannot establish musical quality.

For each quoted unresolved observation, say whether it remains material,
is visible but no longer dominant, or is gone, citing current evidence. Where
the previous passage is supplied, identify any regression. Name the passages
that now hold and what later revisions should preserve. Add a new issue only
when it matters to the next revision. Say plainly if no further material
change is warranted within what you could inspect.

Scope: report concrete problems in this film and say what already works.
Propose direct changes to the work. No speculative infrastructure, hash
registries, score rubrics, or repeated checks of settled issues. Do not
manufacture a criticism to fill a category.
```

An independent review of the pilot establishes what that passage supports.
Review the assembled whole before describing the film as independently
reviewed. A new reviewer model or new media capability changes the comparison
basis; do not turn scores from different conditions into a progress claim.
The ranked observations and protected qualities are more useful than a number.

### Self-review when selected or required by the host

Use the same viewing sequence and questions. Watch the cut before returning
to code, write what is visible at each consequential event, and compare the
previous and current passages where a revision is supposed to help. Your
knowledge of the intended story cannot be erased. Do not invent an audience
recognition response or attribute your judgement to a nonexistent reviewer.
Continue rendering and revising within the budget; a lack of independent
review does not make an obvious visible problem unfixable.

Record the actual mode, reviewer identity when applicable, and inspected media
in `review-log.md`. Describe independence as `self`, `same-family` or
`cross-family` according to the actual pairing. Claude creating and Codex
reviewing is `review_independence: cross-family`. If the actual executor and
reviewer share a model family, label it `same-family` and keep acceptance
provisional. A separate thread alone does not establish a cross-family pairing.
Keep the useful short quotes, what holds, the decision on each material finding
and the next action. State
modality gaps together in that entry. Do not manufacture a PASS for a review
that never returned or for playback that nobody could perceive.

## Phase 6 — Decide, revise, and preserve what works

Read criticism as a colleague's observation. The reviewer is well placed to
say that a peel is unreadable; it may be wrong that lowering roughness will
make it readable. Find the corresponding shot and source, verify that the
current render contains the intended change, then decide whether the remedy
belongs to timing, camera, construction or surface treatment. A dead edit,
stale render and inadequate primitive can look identical from outside.

Make the smallest coherent revision that resolves the highest-value problem.
“Coherent” can mean changing a whole causal passage: a clearer handoff may
require a new path, a camera that holds both actors and a later cut. Resist
patching its symptoms in five unrelated shaders. Conversely, a misplaced cut
does not require a new scene architecture. Try a short revised passage before
paying for every affected shot.

Resolve craft disagreements against the fixed reference and story disagreements
against the brief and visible reading. The reviewer may prefer removing a
spectacle that the user deliberately kept. Then make that event communicate
better within the requested film. If the conflict truly requires a new user
decision, present the concrete alternatives and their visible consequences;
continue independent work meanwhile. General reviewer taste does not silently
override the user's direction.

Protect the function of passages that hold: the scale relationship, the quiet
ending, the recognizable face, the contrast that makes an action readable.
When a necessary change affects one of them, establish what will carry that
quality afterward. Compare before and after. Revert a clear regression to its
last good version and try a better targeted construction; do not build the
next revision on top of a known degradation merely because it is newer.

Write a decision when it constrains later work or explains a reversal. State
the observation, chosen action and reason, with the decision it supersedes
when relevant. A useful entry reads, “Keep the roof event requested by the
user; carry the rising arch through contact in one view so the opening has a
visible cause.” It does not need a score table, an implementation diary or a
new rule for all future films.

Refresh the affected renders and assemble the current cut. A sound change can
alter the perceived timing of an unchanged shot; a shared world edit can alter
several apparently unrelated views. Review the consequence in context. Append
one short state line after making a change: applied but not rendered, rendered
but not reviewed, or reviewed with the remaining observation. That distinction
lets a later session resume real work rather than repeat the last discussion.
Return to Phase 4 and then a fresh review round.

## Resuming an existing project or an interrupted run

Open the latest playable cut and read the current plan, relevant decisions and
last review entry. Compare those notes with files and running processes. The
newest filename is not necessarily the latest complete film; code can be ahead
of both the render and the written handoff. Find which revisions were applied,
which outputs actually contain them, and where assembly stopped. Preserve
earlier complete versions while finishing the current one.

If only a plan exists, make the first animatic. If modules render separately,
integrate them into the cut. If a review has not been applied, act on its highest
material observation. If changed shots await rendering, finish their current
outputs; if the cut is assembled but unreviewed, review that cut. Use surviving
assets and settled choices rather than rediscovering the project from scratch.

Inspect partial outputs at their actual failure boundary. Resume missing
ranges without re-rendering valid current work, and avoid substituting older
frames for a missing revision. If a shared dependency changed, finish all
affected shots before presenting a supposedly coherent new version. Keep the
minimum source-to-shot notes needed to make those choices. A small project
does not need an archival database to survive a context reset.

Review contexts need not survive the break. The next fresh context receives
the media, relevant unresolved quotes and protected passages through Phase 5.
Previous recognition results remain historical evidence, not a guarantee
that the current edit still communicates the same thing.

## Stop and hand over a film someone can watch

Finish the current iteration and hand over when no material revision remains
within the inspected scope, the authorized budget is spent, or the user asks
to stop. A bounded completed run can still have an unresolved creative problem.
Give the user the actual result and name the important remainder plainly;
do not postpone delivery indefinitely while chasing optional refinements.
When the user has requested an exact run count, carry it out or explain the
specific unmet dependency instead of silently replacing it with this default.

Deliver the final movie in the requested format, a lightweight preview when
the master is inconvenient to open, and a clear path to the source project.
Keep the dependencies and asset locations required to render it again, with
the commands that actually worked and the selected output settings. A brief
run note is enough. If interactive playback or construction replay was
requested, deliver that runnable artifact too; an MP4 does not replace it.

State which version was reviewed, by whom, through which media, and why the
loop stopped. For same-family review, record `acceptance_status: provisional`;
for self-review, state that independent acceptance has not occurred. Independent
feedback and successful decoding serve different purposes. If only sampled
images were inspected, do not claim normal-speed audiovisual approval. Put
the playable film in front of the user; their response is the final creative
acceptance. The public film and its presentation need no process disclaimers
overlaid on the images: keep review status in the handoff and working notes.

## Worked experience — Out of Line

This workflow draws on an existing 60-second coded short, *Out of Line*,
developed from the craft of an existing commercial reference. A brass
line-painting machine erases a chalk face, encounters a paper flower, bends
its path around it and grows a new environment of paint. An overhead view
reveals an enlarged version of the opening face; the film returns to the
flower. The film was made with code-authored Blender scenes and a programmed
score. [Watch the finished film](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/examples/out-of-line/).
Its production project is maintained separately from this skill package.

The earlier work used Claude as executor and Codex for reviews. Those reviews
included asset stills, a story discussion and film readings from images and
motion strips. Those are distinct forms of evidence. After an interrupted v3,
Codex completed the export and performed self-review at the user's request.
This skill was distilled afterward; it was not the instruction file under
which every historical round ran, and that history is not a fresh end-to-end
test of either packaged runtime.

Several observations earned their place in the workflow. The paint initially
read as manufactured strips and cable; pooling, contact and different body
constructions mattered beyond roughness. The reviewer could recognize the
story yet remain unsure how the first arch rose: a cut hid the separation.
Later, a recognizable overhead face still needed a preceding view of the
machine drawing its features to establish authorship. A beautiful reveal and
a clear causal reveal are separate achievements.

The portrait was redesigned to share the opening doodle's recognizable
features instead of pursuing a more elaborate realistic head. That changed
the drawing plan, world layout and reveal camera together. A subsequent handoff
shot kept the machine and independently advancing paint in the same frame.
Changing that camera also required removing a lens treatment inherited from
the older chase view. These are examples of following a visual decision through
its consequences, not recipes for every film.

The v3 recovery also exposed concrete production work: missing and truncated
frames, renders from before a shared world change, and post-processing that
could start while frames were still being written. The completed cut reused
unaffected shots explicitly and rebuilt the changed ones. A short cold-start
comparison found no visible performance change in the tested passage; that
result says nothing about untested simulations. Technical delivery did not
resolve every creative issue: the roof passage retained weak context, an
earlier lift retained an angular intermediate pose, and some curls still read
as designed cable. The v3 inspection used stills and action sequences, not a
new independent normal-speed audiovisual review.

Take the causal lessons. Its duration, frame rate, tempo, shot count, renderer,
render settings and directory layout belong to that production. Choose them
again for the next film. The transferable method is to study, make, inspect
what exists, confront it with a fresh reading, and turn that reading into the
next visible decision.
