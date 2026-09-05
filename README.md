# ALIGN — Agentic Loop Image GeneratioN

English · [中文](README_CN.md) · [Interactive gallery](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/)

[![Qingming in Wuhan — the final handscroll](docs/assets/cc-final-whole.png)](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/examples/qingming-wuhan/qingming-wuhan-preview.html#p=1)

*Qingming in Wuhan* · Claude executor + Codex MCP reviewer · 11 versions. [Explore the scroll and replay its construction →](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/examples/qingming-wuhan/qingming-wuhan-preview.html#p=1)

[![Figure 1 — the ALIGN workflow](docs/figure1.png)](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/examples/align-figure/figure.html#p=1)

Figure 1 is itself a p5.js program: six construction stages and an [SVG export](docs/figure1.svg).

ALIGN gives a coding agent a reference image and a subject, then asks it to write the program that draws the picture. Strokes, layers and construction order live in editable source. The paintings and method figure above were made this way.

The loop is straightforward: study the reference, specify the work, draw and render, ask a fresh reviewer to look at the pixels, then change the program. A small wiki keeps the decisions and reasons across rounds. Feedback can be accepted, challenged against the reference, or reverted when the result gets worse. The skills follow [HERO](https://github.com/wanshuiyin/HERO-Anti-OverDefense/blob/main/RULES.md): useful work and concrete checks, without extra defensive machinery.

## What the loop changed

![Four stages of the Wuhan bridge: v1, v4, v7 and v11, at the same viewport](docs/assets/wuhan-loop-evolution-en.png)

Later rounds repair the bridge's contact with the banks, place people behind the rail, and develop boats and groups of people. The changes are visible at the same viewing scale. [Browse all 11 versions →](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/examples/qingming-wuhan/iterations/index.html)

![Wuhan blind-review scores: B1 separately at 3.5; B2–B11 rise from 4.5 to 7.0, with two plateaus](docs/assets/wuhan-review-scores-en.png)

B2–B11 used gpt-6-astra: 4.5 → 7.0, with two plateaus. B1 used gpt-5.6-sol and is shown separately. The vertical axis starts at 3.5; scores are out of 10. [Original review log](examples/qingming-wuhan/wiki/review-log.md).

## The same subject, two runs

![Final Wuhan scrolls and details: Claude executor with Codex MCP review, and Codex executor with independent Codex subagent review](docs/assets/wuhan-two-runs-en.png)

In these two runs, the Claude + Codex result has richer street scenes, more varied groups of people and more depth around the bridge and boats. The Codex + Codex result retains more repeated building blocks. Both used review loops: 11 rounds for the former, 13 for the latter. [Open the comparison →](https://wanshuiyin.github.io/ALIGN-Agentic-Loop-Image-GeneratioN/#comparison)

## Use the skills

Two tasks, with a complete skill for each runtime:

| Task | Claude Code | Codex |
|---|---|---|
| Paint from a reference, or carry its craft into a new subject | [reference-art-loop](skills/reference-art-loop/SKILL.md) | [reference-art-loop-codex](skills_codex/reference-art-loop-codex/SKILL.md) |
| Draw a method figure with construction replay and SVG export | [method-figure-loop](skills/method-figure-loop/SKILL.md) | [method-figure-loop-codex](skills_codex/method-figure-loop-codex/SKILL.md) |

**Claude Code:** copy the desired folder from `skills/` into your project's `.claude/skills/` ([skill setup](https://code.claude.com/docs/en/skills)). Connect Codex MCP for independent visual review:

```sh
claude mcp add codex --scope user -- codex mcp-server
```

```text
/reference-art-loop Qingming Along the River → Wuhan → p5.js handscroll, rounds: 8
/method-figure-loop Reference Figure 1 → my method → p5.js, rounds: 5
```

**Codex:** open this repository; `.agents/skills/` exposes both ports. Each review round uses a new Codex subagent with a separate context. [Setup and usage](skills_codex/README.md).

```text
$reference-art-loop-codex Qingming Along the River → Wuhan → p5.js handscroll, rounds: 8
$method-figure-loop-codex Reference Figure 1 → my method → p5.js, rounds: 5
```

Supply a reference image, an output directory and the subject or method to draw. The agent needs image viewing, local browser rendering and the corresponding reviewer connection.

## Three worked examples

All three main examples were drawn in Claude Code and reviewed through Codex MCP.

| Example | What you can explore |
|---|---|
| [Qingming in Wuhan](examples/qingming-wuhan/) | 11 runnable versions, fixed-view evolution, process sheets and review decisions |
| [Figure 1](examples/align-figure/) | Final program, seven PNG/SVG versions, five blind-review replies and design decisions |
| [A Thousand Li of Rivers and Mountains](examples/qianli-process/) | Final program, ten painting stages, an evolution sheet and 11 blind-review records |

The review records also show the limits. Neither main painting passed its visual gate; the Codex Wuhan run did not pass either. Figure 1's last independent review was v5 at 7/10; v6 and v7 were self-reviewed. The two Wuhan runs differed in starting point, iteration count and human input, so the comparison describes these works. The planned tests of specifications versus direct coding, and external review versus self-review, have not been run.

[MIT](LICENSE) for original repository content. [Third-party sources and licenses](THIRD_PARTY_NOTICES.md).
