# Independent Codex reviewer protocol

Use this for the visual rounds of `reference-art-loop-codex`. The reviewer
judges supplied pixels against a fixed reproduction. It must not inspect
the generator, project wiki or the main agent's reasoning.

## Launch and context

Create a new Codex subagent for each round through the host's available
delegation tool. Request no inherited conversation. In a host exposing
`fork_turns`, set it to `"none"`; do not rely on the usual inherited-history
default. Use the host's actual API rather than copying a tool call from
another product. The prompt below is task content, not executable API syntax.

Prefer a read-only reviewer environment when the host offers one. Otherwise
instruct the subagent to make no writes and read only the named images. Do
not claim a read-only sandbox was enforced when the tool only provided a
prompt boundary. Shared filesystem access does not by itself isolate files;
independence here means a fresh context, restricted task input and no source
inspection, not security isolation or model diversity.

The reviewer receives:

- Exact local image paths for the reference reproduction and any fixed
  reference crops, candidate whole image, fixed crops and enlargement.
- The viewing dimensions, crop locations/scales, craft claim, work name and
  stage labels needed to interpret the process sheet.
- The process sheet for round 1 and whenever stage order or replay changes.
- At most a short set of unresolved visual observations quoted from the
  previous round, supplied after the image list. Leave out settled issues.

It does not receive source files, manifests containing code, parent history,
earlier scores, suggested fixes, implementation descriptions or the claim
that the newest version improved. Do not give it a directory to explore.

## First round: complete prompt

Fill the paths, dimensions, craft claim and stage labels below. List every
fixed view that was actually rendered; replace the scroll-specific crop
names for another composition. Give absolute local paths so the subagent
does not need to search. Do not send this protocol file as another source
for the reviewer to read; put the complete instructions directly in its task.

```text
Independent blind visual review, round R01.
You are reviewing images only. Do not read source, HTML, scripts, project
documents, prior logs or other files. Do not search the project and do not
modify files. Open every listed image with your available image-viewing
tool; filenames and metadata are not visual evidence. If an image cannot
be opened, identify it and do not issue a completed visual verdict.

Reference:
- <ABS_PROJECT>/reference/<fixed-image> — the exact target reproduction
- <absolute reference crop paths> — <corresponding passages and scale>
Candidate:
- <ABS_PROJECT>/review/round-01/whole.png — <dimensions and normal viewing size>
- <ABS_PROJECT>/review/round-01/left.png — <full-art rectangle and scale>
- <ABS_PROJECT>/review/round-01/middle.png — <full-art rectangle and scale>
- <ABS_PROJECT>/review/round-01/right.png — <full-art rectangle and scale>
- <ABS_PROJECT>/review/round-01/water.png — <quiet-ground rectangle and scale>
- <ABS_PROJECT>/review/round-01/detail.png — <rectangle>, enlarged at <scale>
Process:
- <ABS_PROJECT>/review/round-01/process.png — before/after pairs for <stage labels>

The reference work is <work name>. The intended material appearance is
<CRAFT_CLAIM>. This is a code-drawn interpretation at <viewing size>.
The craft sequence is <stage labels>; <documented or reconstructed, when
relevant>. Judge whether the supplied pixels support that appearance and
process. An enlargement diagnoses marks; judge the finish at normal size.

First identify one concrete visible detail in the reference and one in
the candidate enlargement to establish that you viewed both. There is no
earlier score or reviewer conclusion to reproduce.

Report concisely:
1. The most material visible departures from the reference and from the
   claimed medium, ranked by their effect on resemblance. For each, locate
   what you see and suggest one direct visual or craft change. Distinguish
   features present in the reference from synthetic features introduced
   by the candidate. Give measurements only when the stated scale supports
   them. Do not infer code defects from appearance alone.
2. In the process sheet, does each after-panel visibly add the
   named material, and is the sequence plausible? Name any stage mismatch.
   Distinguish what pixels show from any historical inference. A still
   contact sheet cannot prove replay determinism or the exact brush order.
3. When lettering is present: does it read as written or
   typeset? Locate the cause in stroke behavior, glyph skeleton or layout.
4. What already holds and should be preserved in later repaints.
5. Does any remaining computer-origin tell at normal size warrant another
   repaint? Answer directly and name it. Do not grant a pass merely because
   a candidate is attractive or a previous reviewer rated it highly.

Propose changes to the artwork and its craft process, not helper tools,
frameworks, extra gates or unrelated features. Report actual flaws and
say plainly what is working. Do not invent observations to fill a quota.
No numerical score is needed unless the main task explicitly requests it.
```

## Later round: complete prompt

Use a fresh subagent even when the previous reviewer performed well. Fill
`NN` with the candidate number and insert only the preceding round's still
unresolved observation quotes. Remove the reference-crop or process-image
line only when that item is not part of the current packet; do not invent
a path. If stage order or replay changed, the new process sheet is required.

```text
Independent blind visual review, round R<NN>.
You are reviewing images only. Do not read source, HTML, scripts, project
documents, prior logs or other files. Do not search the project and do not
modify files. Open every listed image with your available image-viewing
tool. Filenames and metadata are not visual evidence. If a required image
cannot be opened, identify it and do not issue a completed visual verdict.

Reference:
- <ABS_PROJECT>/reference/<fixed-image> — the same exact target reproduction
- <absolute fixed reference crop paths> — <corresponding passages and scale>
Candidate:
- <ABS_PROJECT>/review/round-<NN>/whole.png — <dimensions and normal viewing size>
- <ABS_PROJECT>/review/round-<NN>/left.png — <full-art rectangle and scale>
- <ABS_PROJECT>/review/round-<NN>/middle.png — <full-art rectangle and scale>
- <ABS_PROJECT>/review/round-<NN>/right.png — <full-art rectangle and scale>
- <ABS_PROJECT>/review/round-<NN>/water.png — <quiet-ground rectangle and scale>
- <ABS_PROJECT>/review/round-<NN>/detail.png — <rectangle>, enlarged at <scale>
Process, if supplied in this packet:
- <ABS_PROJECT>/review/round-<NN>/process.png — before/after pairs for <stage labels>

The reference work is <work name>. The intended material appearance is
<CRAFT_CLAIM>. This is a code-drawn interpretation at <viewing size>.
The craft sequence is <stage labels>; <documented or reconstructed, when
relevant>. Judge whether the supplied pixels support that appearance and
process. An enlargement diagnoses marks; judge the finish at normal size.

First identify one concrete visible detail in the reference and one in
the candidate enlargement. Inspect the images independently, then assess
the previous observations. Do not assume that a newer version is better.

Previous unresolved visual observations, quoted without proposed remedies:
- "<exact short observation from previous round>"
- "<exact short observation from previous round>"

Report concisely:
1. The most material visible departures from the fixed reference and the
   claimed medium, ranked by their effect on resemblance. For each, locate
   what you see and propose one direct visual or craft change. Distinguish
   features already in the reference from artifacts introduced by this
   candidate. Use measurements only when the supplied scale supports them;
   do not infer specific implementation defects from pixels alone.
2. For each quoted observation: still material / visible but no longer
   dominant / gone. Give one concrete piece of visual evidence for each.
   Then name any newly material issue that should affect the next repaint.
3. If a process sheet is supplied: does each after-panel add its named
   material plausibly, and is the sequence plausible? Locate any mismatch.
   Distinguish visible evidence from historical inference. A contact sheet
   cannot establish replay determinism or the exact historical brush order.
   If no sheet is supplied, do not claim to have checked the process anew.
4. If lettering exists and is still unresolved, does it read as written or
   typeset? Is the cause stroke behavior, glyph skeleton or layout?
5. What now holds and should survive further changes. Name regressions
   visible in the supplied image instead of accepting improvement by default.
6. Does any remaining computer-origin tell at normal size warrant another
   repaint? Answer directly and name it. A more attractive candidate is not
   automatically a closer material or compositional match to the reference.

Propose changes to the artwork and craft process, not helper tools,
frameworks, extra gates or unrelated features. Report real flaws and what
is working. Do not invent observations to fill a quota. No numerical score
is needed unless the main task explicitly requests it. Do not claim a
cross-model review: this is an independent Codex context.
```

## Optional source review

Use a separate subagent only for a concrete uncertainty that image review
cannot resolve. Prefer settling known replay or stage-state issues before
the first blind round. If a later primitive change introduces a new source
issue, inspect it separately; do not rerun a generic code review every round.

```text
Focused source review of <absolute project path>.
Read only <specific source paths>. Do not modify files.
Resolve this concrete question: <e.g., whether backward scrubbing rebuilds
the same stored marks or changes random choices during draw>.
Trace the relevant action/state path, identify the actual failure if one
exists, and propose the smallest direct fix. Report file locations and the
reason. Do not score the artwork or claim a blind visual pass. This task
has access to source; its context will not be reused for image-only review.
```

## After the response

Verify that the reviewer really opened both reference and candidate images.
A visually specific sentence helps establish access; tool activity, when
exposed, is stronger evidence. If access failed, fix the packet and finish
that same candidate review. Do not count the failure as a completed round.

Save the reviewer identity, image packet paths, material observations as
short exact quotes, process findings and the main agent's resulting action
in `wiki/review-log.md`. Keep enough actual feedback to distinguish an
external subagent response from a main-agent summary. The next reviewer
receives only unresolved observation quotes, not this complete log.

If the reviewer has already read code or inherited the main conversation,
classify its result as informed review and use a fresh properly scoped
subagent for the blind round. Follow-up within a round is appropriate only
to resolve image access or clarify an observation; the next round still
starts with a new context.

Two useful distinctions:

- A review without the fixed reference is not comparable to one with it.
  Mark that boundary in the record; do not splice their scores into one
  trajectory or retrospectively claim the earlier round used the reference.
- A completed visual review is not a source review. If state, clipping or
  replay needs code inspection, use a separate concrete task. Do not feed
  its findings to the blind reviewer as expected visual conclusions.
