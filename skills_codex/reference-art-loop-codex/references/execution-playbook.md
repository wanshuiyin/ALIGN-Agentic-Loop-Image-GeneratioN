# Execution playbook: a new p5.js run with runnable history

Use this when the user wants a new browser artwork, repeated Codex visual
reviews, and preserved runnable versions. Adapt the same sequence to Canvas
or SVG. This playbook provides project conventions and examples, not a new
Codex API or a mandatory framework.

Contents: [bootstrap](#bootstrap), [renderer contract](#renderer-contract),
[freeze HTML](#freeze-html), [capture and replay](#capture-and-replay),
[fonts and offline delivery](#fonts-and-offline-delivery),
[round commands](#round-commands), [round records](#round-records),
[failure recovery](#failure-recovery), [handoff](#handoff).

## Bootstrap

1. Inspect the user-supplied directory and applicable instructions. Identify
   the output path, reference image and requested count. Confirm by inspection
   whether this is a new project or an existing implementation to improve.
   When the user says “from zero,” build new drawing code; do not seed it
   with the former artwork's generator or relabel old versions as new rounds.
2. Locate actual tools: a working shell and Python or Node, an installed
   browser/rendering tool, local image viewing and native Codex subagents.
   Read an existing project's package files and helper `--help` output before
   guessing commands. Test one tiny browser page if browser availability is
   uncertain. Use existing dependencies before installing replacements.
3. Fix and open the reference. Write `wiki/reference.md` and `wiki/plan.md`
   with viewing dimensions, composition, scale, mark vocabulary, stage order
   and the exact meaning of a round. Create only the directories used below.
4. Build one representative passage and an operational replay. Capture it
   at normal size and diagnostic scale. Fix blank output, font fallback,
   broken clipping and obvious new artifacts before expanding the scene.
5. Complete the first composition, freeze R01 and render its full packet.
   The first blind review must see both the real reference and that packet.

A practical project layout is:

```text
<project>/
  index.html                 editable development entry
  src/
    painting.js              new geometry and stored drawing actions
    player.js                playback, scrubbing, stage and viewport controls
    style.css                presentation
  vendor/                    locally retained p5 build and any required fonts
  reference/                 fixed reproduction and fixed reference crops
  scripts/
    package.py               project-specific freezer, when useful
    render.py                project-specific browser capture, when useful
  rounds/
    round-01.html            frozen runnable first reviewed candidate
    round-02.html            frozen runnable next candidate
  review/
    round-01/                whole, fixed crops, detail, process and check result
    round-02/
  wiki/
    reference.md
    plan.md
    gates.md
    review-log.md
    decisions.md
  <artwork>.html             final display file
  history.html               links to retained rounds, if requested
```

The skill does not ship the `scripts/package.py` or `scripts/render.py`
shown here: create or adapt those project-local helpers to the entry page
you actually authored. Their useful contracts are given below. A project
with working equivalent tools should keep its own filenames and interfaces.
Do not copy another artwork's drawing implementation to obtain its helpers.

A local preview can use a known unused port and a real server process:

```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory <absolute-project-path>
```

Replace the path and port; shell-quote paths containing spaces. Run this
through the host's execution tool and retain its live session or process
handle. Open `http://127.0.0.1:8765/index.html`. A printed URL alone does not
prove that the server or browser is running. Do not publish to an external
host unless that action is part of the user's request.

## Renderer contract

Keep the drawing and replay implementation shared between the visible page
and the capture helper. A useful application-owned interface is:

| Member | Meaning to implement in the project |
| --- | --- |
| `window.artReplay.ready` | True only after geometry, initial surface and required fonts are ready. |
| `window.artReplay.seek(p)` | Use the same progress path as the visible slider; resolve after the requested frame is painted. |
| `window.artReplay.setCamera(x)` | Change the visible scroll position using the same camera as the page. |
| `window.artReplay.image()` | Optional PNG data URL of the actual full artwork surface, excluding UI. |
| `window.artReplay.stages` | Actual stage names and start/end progress boundaries. |
| `window.artReplay.version` | Frozen candidate name, such as `R01`; useful for diagnosing a stale page. |

These names are suggestions you implement, not p5.js or Codex built-ins.
Use the project's existing equivalent interface instead of adding a second
renderer. A public interface helps full-scroll capture, but still exercise
the actual slider, buttons and stage controls at least once and after their
behavior changes.

For a new project, a simple structure is `buildPainting(seed)` producing
stable geometry plus stage-tagged actions, and `drawUntil(progress)` replaying
them on one artwork surface. Build color, widths, jitter, clipping geometry
and random choices once. On backward scrubbing, clear to the correct support
and replay from the beginning or from a proven equivalent stage snapshot.
Never layer a partial repaint over a future frame without clearing it.

Use a fixed seed or store the generated choices in a frozen version. A
historical page that changes its composition on each reload is not a stable
record even if its source file is preserved. A final export must use its
own frozen geometry/seed and styles; it must not read the latest project
configuration at runtime.

State readiness after the first visible frame, not merely after script
evaluation. If `seek` processes actions over several frames, return a
promise or expose an explicit pending/settled condition and wait for it.
Hardcoded sleeps can capture incomplete paint. A process-stage screenshot
must correspond to the recorded stage boundary, not to an assumed `i / 10`
when the implementation uses unequal stage durations.

## Freeze HTML

When the user requests runnable history, freeze the candidate *before*
its review and render the frozen page itself. Then the review image and
the delivered historical page refer to the same code. A new R02 must be
created after R01 feedback led to a visible change.

For a small p5.js page, a self-contained HTML can be produced by a focused
project-local packager:

1. Read the known entry HTML, the local p5 build, authored drawing/player
   scripts and stylesheet. Preserve their execution order.
2. Inline those known scripts and CSS. Escape a case-insensitive `</script`
   sequence inside inline JavaScript as `<\/script`; do not accidentally
   terminate the enclosing HTML script element. If the application uses
   modules or a build system, use its bundler rather than assuming that
   concatenation preserves module semantics.
   Assemble script contents separately, then insert them once at a known
   boundary in the original HTML template. Do not repeatedly search and
   replace closing-body text in a document that already contains library
   source: JavaScript strings can contain the same text.
3. Embed required local fonts and small assets as appropriate data URLs,
   or copy them into a version-specific asset directory. CSS `url(...)`
   paths are resolved relative to the original stylesheet: after inlining,
   their base changes to the HTML document unless rewritten.
4. Write `rounds/round-NN.html` with an exclusive create operation, such as
   Python `open(target, "x", encoding="utf-8")`. An existing reviewed round
   is not silently overwritten. Repair an unreviewed packaging attempt
   only after recording that it never became a completed reviewed version.
5. Load that output in a fresh browser context. Verify scripts, fonts,
   stage controls and artwork pixels. Capture the review images from it.
   Only then promote the selected reviewed output to `<artwork>.html`.

For a hand-authored classic-script page, this small embedding pattern is
useful inside its packager; adapt the file list and markers to the real HTML:

```python
import base64
import re
from pathlib import Path

def inline_script(path: Path) -> str:
    source = path.read_text(encoding="utf-8")
    source = re.sub(r"</script", lambda _: r"<\/script", source, flags=re.I)
    return "<script>\n" + source + "\n</script>"

def font_data_url(path: Path, verified_mime: str) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return "data:" + verified_mime + ";base64," + encoded

# Example only: the entry template must contain these exact markers.
# Replace them once in the original template, with scripts in known order.
# html = html.replace("<!-- ART_STYLE -->", "<style>" + css + "</style>")
# html = html.replace("<!-- ART_SCRIPTS -->", "\n".join(
#     inline_script(root / p) for p in
#     ["vendor/p5.min.js", "src/painting.js", "src/player.js"]))
```

Avoid an unbounded HTML-rewriting framework for a page whose own structure
you control. Check that each expected marker or import actually existed
and was replaced; do not emit a “successful” bundle still importing `src/`.
Keep a library's license notice and record the dependency version used.

A version-directory alternative is also valid when a single file was not
requested: `rounds/round-01/index.html` can reference that directory's own
`src/`, `vendor/` and assets. Relative links to mutable `../../src/` defeat
the freeze. A wrapper iframe around the latest page is likewise not history.

After later source edits, reopen an early round in a fresh context and
compare its pixels with its stored packet. Also test a middle and final
round at handoff. For a single-file deliverable, open a temporary copy away
from the source tree; successful access to files beside the development
entry does not establish that the exported file is self-contained.

## Capture and replay

Write the fixed views into `plan.md` as actual rectangles and output sizes,
not only names such as “middle.” Give coordinates in full artwork pixels
and record any separate viewport scaling. Reference crops must represent
the corresponding passages. If the composition is intentionally compressed,
record how those correspondences were chosen.

The render helper should accept a candidate path or round number, an output
directory and whether the process sheet is due. It must load the frozen
HTML for that candidate, wait for real readiness, set the same fixed camera
and progress, capture PNGs, and report page errors or missing assets. A
successful process exit with a blank canvas is still a failed render.

For a Python environment already providing Playwright, this capture core
uses the application interface above. Replace `url`, `out` and the selector
with real values, and implement the interface before using the snippet.
The native [Playwright screenshot APIs](https://playwright.dev/python/docs/screenshots)
support element and page captures; a canvas capture excludes changing UI.

```python
from pathlib import Path
from playwright.sync_api import sync_playwright

url = "http://127.0.0.1:8765/rounds/round-01.html"
out = Path("review/round-01")
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as play:
    browser = play.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1280, "height": 900}, device_scale_factor=1)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(url, wait_until="load")
    page.wait_for_function("window.artReplay && window.artReplay.ready")
    page.evaluate("async () => { await document.fonts.ready; }")
    page.evaluate("async () => { await window.artReplay.seek(1); }")
    canvas = page.locator("canvas[data-art-canvas]")
    canvas.screenshot(path=str(out / "direct.png"))
    for progress in (0.35, 0.70, 0.12, 0.92, 1.0):
        page.evaluate("async p => { await window.artReplay.seek(p); }", progress)
    canvas.screenshot(path=str(out / "replayed.png"))
    page.screenshot(path=str(out / "page.png"), full_page=True)
    browser.close()
    if errors:
        raise RuntimeError("\n".join(errors))
```

Set an observed timeout suitable for the actual renderer rather than
inheriting another project's startup number. This snippet captures the
visible canvas; use the real offscreen artwork surface through `image()`
when the work is wider than the viewport. Derive all full-art crops from
that same pixel surface, never from a second rendering implementation.

For an exact difference with Pillow already available:

```python
from PIL import Image, ImageChops

a = Image.open(out / "direct.png").convert("RGB")
b = Image.open(out / "replayed.png").convert("RGB")
if a.size != b.size:
    raise RuntimeError("Replay captures have different dimensions")
diff = ImageChops.difference(a, b)
changed_pixels = sum(any(channel != 0 for channel in pixel)
                     for pixel in diff.getdata())
print({"changed_artwork_pixels": changed_pixels, "bounds": diff.getbbox()})
diff.save(out / "replay-difference.png")
```

The expected same-environment result is zero changed artwork pixels. A
nonzero result requires inspection: ensure identical camera, scale, support,
font readiness and settled frames, then look for mutable draw-time choices.
Do not add a tolerance that hides an actual replay defect. Record a capture
limitation if the environment cannot establish an exact comparison.

Also drive the real slider to a lower value and back to full, using its
actual DOM locator and input/change behavior, then compare against `direct`.
Click play, observe progress advance, click pause and confirm it stops;
select a named stage and inspect its material. An exported helper that works
while the UI is broken is not a passing user experience.

For the process sheet, query actual stage boundaries, capture immediately
before and after each, crop where that stage changes the work, and label
the stage/material outside the art. Keep paired crops at identical scale.
Use separate pages or larger panels when a single sheet makes marks too
small. Inspect every pair: “no visible change” may indicate a poorly chosen
crop, mislabeled stage or genuinely missing replay work.

## Fonts and offline delivery

List the actual strings drawn into the artwork, including uncommon CJK
characters, and the fonts used for them. Before using their geometry, await
`document.fonts.load(fontDeclaration, fullString)`, then `document.fonts.ready`.
Inspect rendered glyphs at delivery scale and in a lettering crop. A CSS
font-family name, successful load event or `document.fonts.check` alone does
not prove that every desired character came from the intended face.
Inspect the downloaded font's actual file format before choosing MIME and
CSS `format(...)`: a response saved as `.woff2` may still contain TrueType
bytes. Use a file-inspection tool or inspect the signature (`wOF2`, `wOFF`,
`OTTO`, or the TrueType sfnt header) and make the retained extension, data
URL MIME and font declaration agree with those bytes.

Test the delivered artifact in a fresh browser context with cache history
absent. For a self-contained `file://` page, blocking HTTP and HTTPS requests
while permitting data/file resources verifies that remote fonts or CDN code
are not silently required. For a page served over local HTTP, allow only its
local origin and block other origins. Playwright supports request monitoring
and routing in its [network API](https://playwright.dev/python/docs/network).

```python
# Add this to a fresh context before navigation when testing local HTTP.
from urllib.parse import urlparse
allowed_origin = "http://127.0.0.1:8765"
blocked = []
def local_only(route):
    parsed = urlparse(route.request.url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if parsed.scheme in ("http", "https") and origin != allowed_origin:
        blocked.append(route.request.url)
        route.abort()
    else:
        route.continue_()
context.route("**/*", local_only)
```

Use a fresh context without service-worker-controlled state when checking
network dependence. Inspect blocked requests and the resulting lettering.
Resolve required remote fonts by packaging a permitted local copy, choosing
an available faithful face or explicitly documenting a fallback. When a
font skeleton supplies brush geometry, its fallback changes the art itself;
test that exact delivered choice, not only the interface font.

## Round commands

Once project-local helpers implement the contracts above, the normal serial
sequence can look like this from the project directory:

```bash
python3 scripts/package.py --round 1
python3 scripts/render.py --round 1 --process
```

Open the generated images. Then invoke a fresh visual subagent using the
complete first-round prompt in [reviewer-protocol.md](reviewer-protocol.md).
In the current host, native delegation is a direct tool call with the shape
below. This is a tool example, not a shell command; replace the `message`
with the filled complete prompt. Check the runtime schema in another host.

```json
{
  "task_name": "visual_r01",
  "fork_turns": "none",
  "message": "<complete first-round image-only prompt with absolute paths>"
}
```

The current tool name is `collaboration.spawn_agent`. Do not put this call
inside `functions.exec`; use the host's native delegation channel. Do not
add unsupported `sandbox` or model fields. Record the returned agent handle.
Keep dependent review rounds serial while independent source/runtime work
can proceed without changing that reviewer's frozen candidate.

After the actual response: record its observations, make one coherent
repaint addressing the highest material issue, check the representative
passage, then create and render R02:

```bash
python3 scripts/package.py --round 2
python3 scripts/render.py --round 2 --process
```

`--process` is needed for R01 and changes to stage/replay behavior; omit it
for an unchanged process when the available helper supports that choice.
Use the complete later-round prompt, new task name and `fork_turns: "none"`.
Do not script a loop that generates all 13 candidates before receiving any
feedback. If the helpers have different documented arguments, use those
actual commands and record them once in `plan.md`.

## Round records

Keep a concise recoverable record, for example:

```markdown
## R02 — <date>
- Status: rendered; review running.
- Candidate: rounds/round-02.html; source revision: <commit or snapshot>.
- Frozen code version/seed: <version and selected seed, when used>.
- Previous review applied: R01; highest observation: "<exact short quote>".
- Visible change: <one sentence in craft terms; not a score claim>.
- Views: review/round-02/{whole,left,middle,right,water,detail}.png.
- Fixed reference: reference/<filename>; views unchanged from plan.md.
- Process sheet: <path, or why not due this round>.
- Checks: <actual determinism result and relevant UI observation>.
- Reviewer: <returned task name/handle>; launched with fresh context.
- Response: pending; no completed review counted yet.
```

When the reviewer returns, update that entry with actual image-access
confirmation, material observation quotes, still-material/gone conclusions,
process judgement, accepted action or reference-based disagreement, and
`reviewed; repaint pending` or `handoff ready`. Do not turn “pending” into
“passed” because the main agent likes the image. Retain response evidence in
the log without copying unrelated conversation into every round prompt.

For a repaint performed after R13 but never reviewed, call it an unreviewed
candidate. Either obtain a real additional review when authorized or hand
over the last reviewed candidate plus the clearly labelled experiment. Do
not overwrite R13 or claim that R13's review covered changed pixels.

## Failure recovery

| Current evidence | Continue with |
| --- | --- |
| Browser failed or page is blank | Read the error, repair loading/readiness and rerender the same candidate. No completed round yet. |
| Fonts or assets failed | Fix the packaged dependency or declared fallback, recapture affected views, then review the corrected candidate. |
| Reviewer cannot open one of the required images | Correct its absolute path or image file and finish that candidate's review; the failed attempt does not consume a completed round. |
| Reviewer has not responded | Inspect the actual agent handle; wait or poll while it is live. Never invent a response or assume a timeout is terminal. |
| Reviewer read source or inherited parent history | Label the response as informed review; obtain a fresh correctly scoped blind review of the same candidate. |
| Review complete, repaint absent | Apply the recorded highest material issue next. Do not review unchanged pixels again to advance numbering. |
| Source changed, no frozen render | Complete the partial repaint, freeze it, render and seek review. Do not count the old response against the changed picture. |
| Frozen file and screenshot disagree | Diagnose stale browser cache, wrong entry, asset drift or unseeded generation; recover the actual reviewed version from its snapshot. |

After a context reset, read `reference.md`, `plan.md`, `decisions.md`,
`gates.md` and the latest actual review entries, then inspect the corresponding
HTML and images. Check live handles with the tool currently available.
`collaboration.list_agents` and `collaboration.wait_agent` are available in
the current host; another host may expose different lifecycle tools. A
saved task name alone is not proof that it is still live.

For an execution session returned by a shell tool, poll that session with
its matching continuation tool. If the tool reports that the handle is
missing or terminal, inspect artifacts before resuming only the missing
step. Stop or restart a live browser/server only when the observed problem
requires it, not merely because an output wait elapsed.

## Handoff

Load the actual final display HTML, exercise playback, pause, backward
scrubbing, stage access and scroll navigation, and inspect its packaged
fonts. Confirm the final candidate's independent review and determinism
result refer to that same file. Open early, middle and final frozen versions
and their images when history was requested. `history.html` should link to
actual preserved files, with round labels and a short visible-change note.

Give the user the final display file or running local URL, launch command
when needed, final render, history entry and wiki. State the completed round
count and whether stopping was due to budget, an allowed visual pass or the
user's request. Name remaining material observations and the next useful
primitive change. Do not turn a finite run into a claim of mathematical
optimality or require a new approval to finish already authorized work.
