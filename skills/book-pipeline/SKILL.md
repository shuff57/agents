---
name: book-pipeline
description: "[ACTIVE — in-session] End-to-end bookSHelf pipeline executed inside the current Claude session. Mirrors `scripts/workflows-external/pipeline.py` step-for-step — same ALL_STEPS list, same input/output paths, same lint logic, same skip rules. The only difference: where the external pipeline calls `AIClient.generate()`, you (Claude) do the AI work yourself. Use for: 'run book pipeline for X.Y of {project}' (add `--teach` for teacher edition)."
disable-model-invocation: true
---

# Book Pipeline (In-Session)

> **You are the in-session orchestrator.** Walk `ALL_STEPS` exactly as `scripts/workflows-external/pipeline.py` would, with one change: every `AIClient.generate()` call becomes you reading the input + prompt and writing the output yourself. Every helper script, every file path, every lint check, every skip rule, every correction loop comes from the external pipeline unchanged.
>
> **Reference implementation:** `scripts/workflows-external/pipeline.py`. Whenever an edge case is unclear, read the matching `step_*` function there and mirror it.

## How to invoke

User says: *"run book pipeline for 8.4 of Introduction to Stats"* (optionally `--teach`).

1. Bind: `PROJECT="Introduction to Stats"` · `SECTION="8.4"` · `CHAPTER=8`
2. Resolve `ProjectContext` paths the same way `pipeline.py:ProjectContext.__init__` does — auto-discover `Chapter_N_Source/`, `Chapter_N_Remastered/`, `Chapter_N_Numbered/`, `html/` under `projects/$PROJECT/`. Slug = whatever follows `${SECTION}_` and precedes `.md` in `Chapter_N_Source/`.
3. **Teach mode** (`--teach`): `ctx.remastered_file` routes to `Chapter_N_RemasteredTeach/`, `ctx.numbered_file` to `Chapter_N_NumberedTeach/`, `ctx.html_dir` to `html_teach/`, `ctx.student_remastered_file` points at the (unmodified) `Chapter_N_Remastered/${SECTION}_*.md` for remaster-teach to read. Run `TEACH_PIPELINE_STEPS` instead of `ALL_STEPS` (skips scrape/merge/extract/remaster/stitch).
4. Walk steps in order. Skip any step whose output is fresh (`_output_fresh()` logic — output exists AND output mtime ≥ every input mtime).
5. After each step, emit a one-line status. Hard-stop only on missing required input. Lint failures retry once, then continue with a logged warning.

## ALL_STEPS — verified execution table

`ALL_STEPS = [scrape, merge, extract, normalize-tags, remaster, remaster-teach, number, solutions, youtube, math, html, fixup, stitch, publish]` (verified against `scripts/workflows/pipeline.py:101`).

**Note on `normalize-tags`** (added 2026-04-19): a deterministic pre-remaster step that converts source-format `> **Example X.Y**` blockquote-bold tags into `### Example X.Y` H3 headings. This eliminates a class of remaster format bugs where the AI (in-session or external) preserves the source format instead of converting it. Idempotent — safe to re-run. Only present in active `scripts/workflows/`, not in the frozen `scripts/workflows-external/`.

`TEACH_PIPELINE_STEPS = [remaster-teach, number, solutions, youtube, math, html, fixup, publish]` (no scrape/merge/extract/remaster/stitch — verified at line 120).

**There is no `normalize` step in the active pipeline** (legacy `book-pipeline/SKILL.md` describes one, but the live `ALL_STEPS` does not include it and no `normalize_headings.py` exists in `scripts/workflows/`).

| # | Step | Kind | Helper / Procedure |
|---|------|------|--------------------|
| 1 | scrape | Bash | `python3 scripts/workflows/scrape_concat.py --project "$PROJECT" --source <source-dir>` |
| 2 | merge | Bash | `python3 scripts/workflows/merge.py --input <main.json> --output <merged_chN.json> [--supplemental <s1.json> <s2.json>] [--chapter $CHAPTER]` |
| 3 | extract | Bash | `python3 scripts/workflows/extract_sections.py --input "<merge_dir>/merged/merged_ch${CHAPTER}.json" --output-dir "$PROJ/remastered/Chapter_${CHAPTER}_Source" --chapter $CHAPTER` |
| 3b | normalize-tags | Bash | `python3 scripts/workflows/normalize_source_tags.py --project "$PROJECT" --chapter $CHAPTER --section $SECTION` (deterministic source cleanup; runs between extract and remaster) |
| 4 | remaster | AI (you) | See "Remaster" below |
| 5 | remaster-teach | AI (you), `--teach` only | See "Remaster-teach" below |
| 6 | number | Bash | `python3 scripts/workflows/number.py --input <remastered.md> --output <numbered.md> --chapter $CHAPTER` |
| 7 | solutions | AI (you) | See "Solutions" below |
| 8 | youtube | AI (you) | See "YouTube" below |
| 9 | math | AI (you) + Bash pre-checks | See "Math verify" below |
| 10 | html | AI (you) + Bash assembly | See "HTML" below — uses `html_gen.py --body-file` (the script's official in-session integration point) |
| 11 | fixup | Bash + AI (you) | See "Fixup" below — Phase A is 5 deterministic functions; Phase B uses `prompts/fix-html-block.md` |
| 12 | stitch | Bash, skipped in `--teach` | `python3 scripts/workflows/stitch_chapter_html.py --sections <s1> <s2> ... --html-dir <html_dir> --output <Chapter_N_assembled.html> --chapter-title "Chapter $CHAPTER" --project "$PROJECT"` |
| 13 | publish | Bash + inline verify | See "Publish (= verify + deploy)" below — `_verify_html` runs first, writes `.verify_ok` stamp, then `publish.py` copies to `docs/` (or `docs/teach/` with `--teach`) |

## AI step procedures (mirror of external `step_*` functions)

Every AI step follows this shape (mirrors what each `step_*` does internally):

```
1. Read input file
2. Read prompt file (if it exists; some steps have inline fallbacks)
3. Generate output yourself — replacement for AIClient.generate()
4. Write to the path ProjectContext defines
5. Run the lint command — same one the external step uses
6. If lint fails: feed findings back, edit the output, re-lint
7. Cap at 1 retry. On second fail: log result, continue.
```

### Step 4 — remaster (mirror of `step_remaster()`)
- Input: `Chapter_${CHAPTER}_Source/${SECTION}_*.md`
- Prompt: `prompts/remaster-chapter.md`
- Output: `Chapter_${CHAPTER}_Remastered/${SECTION}_*.md`
- Lint: `python3 scripts/workflows/lint_remaster.py --input <output> --source <input> --json` — threshold 75/100 (in script)
- Correction loop: feed lint JSON findings back, regenerate failing-rule sections, re-lint
- **Chunking threshold: 800 lines** (matches `pipeline.py:step_remaster CHUNK_THRESHOLD = 800`). Below that, do the whole section in one pass. Above that, use the sub-agent pattern below.

#### Sub-agent chunking pattern (for sections > 800 lines)

Same pattern used for step 5 (remaster-teach). Reuses `remaster_chunked.py` which handles all deterministic split/merge bookkeeping.

1. **Split** the source into chunks + manifest:
   ```bash
   python3 scripts/workflows/remaster_chunked.py split \
     --input "$PROJ/remastered/Chapter_${CHAPTER}_Source/${SECTION}_*.md" \
     --output-dir "$PROJ/remastered/Chapter_${CHAPTER}_Remastered/_chunks_${SECTION}/"
   ```
   Produces `chunk_000_preamble.md`, `chunk_001_<slug>.md`, … plus `manifest.json` with cross-chunk context (prev/next titles + boundary paragraphs + running element counts).

2. **Dispatch one sub-agent per chunk in a single message** (parallel). Each Agent call:
   - `subagent_type: general-purpose` (or a specialized agent if one exists)
   - `prompt`: include (a) the full `prompts/remaster-chapter.md` contents, (b) the chunk's input file path, (c) the manifest's cross-chunk context fields for that chunk, (d) instruction to write output to `chunk_NNN_<slug>_remastered.md` in the same dir.
   - Read Try It Now starting number from the manifest's `running_element_counts.tryitnow_before` so numbering stays chapter-sequential.

3. **Merge** chunks back into the final section:
   ```bash
   python3 scripts/workflows/remaster_chunked.py merge \
     --chunk-dir "$PROJ/remastered/Chapter_${CHAPTER}_Remastered/_chunks_${SECTION}/" \
     --output "$PROJ/remastered/Chapter_${CHAPTER}_Remastered/${SECTION}_*.md"
   ```

4. **Lint** the merged output once (same `lint_remaster.py --json` call as monolithic). If failing, you can re-dispatch only the offending chunk(s) — re-run steps 2–3 for just that chunk.

**When to use a sub-agent vs. inline work:** sub-agent calls have setup cost; only worth it for large sections where parallelism beats the overhead. For sections between 800 and ~1500 lines, 3–5 sub-agents usually completes in roughly the time of one monolithic call.

**Pre-generation checklist — read before you start writing:**

1. **Examples / Try It Nows / Guided Practice / Definitions use `### H3` headings.** NEVER `> **Example X.Y**` blockquote-bold. NEVER `## Example` H2. The prompt's "Heading format — STRICT" section is non-negotiable; verify with the ✓/✗ examples there if unsure.
2. **Try It Now numbering is chapter-sequential** (`Try It Now 8.41`, `8.42`, `8.43`, …) NOT per-subsection (`8.1`, `8.2`, `8.1`, …). The number resets per chapter, not per subsection.
3. **Source attribution required:** `**Source:** [Book Name]` within the first 3 lines of every Example, Try It Now, Guided Practice, Definition, and Problem Set. Use "Main Text" if unknown.
4. **`> **Label:**` blockquote-bold IS correct and REQUIRED for callouts** — Context Pause, Insight Note, named procedure boxes, named rules. Just NOT for Examples / Try It Nows / Guided Practice / Definitions.
5. **Aim for textbook density, not study-guide compactness.** Per-subsection: at least 1 Context Pause, 1 Insight Note, 1 Try It Now, plus all source-derived Examples/Definitions/Guided Practices preserved verbatim. Use display math `$$...$$` for any computation worth showing the steps for; use explicit `**Solution:**` headers and bolded sub-step breaks within Examples.
6. **Currency:** always write `\$1,000` (escaped dollar + plain comma). Avoid `\$1{,}000` with curly braces — it's stylistically inconsistent and historically tripped the math-delimiter lint. The lint has been patched to strip `\$` before regex matching (so curly-brace form no longer fails outright), but the canonical form remains `\$1,000`. Do NOT leave the dollar sign unescaped (`$500` collides with math-mode detection).

### Step 5 — remaster-teach (mirror of `step_remaster_teach()`)
- Only runs in teach mode (when user invoked with `--teach`)
- Input: `ctx.student_remastered_file` = `Chapter_${CHAPTER}_Remastered/${SECTION}_*.md` (the student edition produced by step 4)
- Prompt: `prompts/remaster-teach.md`
- Output: `Chapter_${CHAPTER}_RemasteredTeach/${SECTION}_*.md` (assigned to `ctx.remastered_file` in teach mode so all later steps pick it up automatically)
- Lint: same `lint_remaster.py` (rules apply to both editions)
- **Chunking threshold: 800 lines** (matches `pipeline.py:step_remaster_teach CHUNK_THRESHOLD = 800`). Teach inputs are often 1500–3000 lines because they read the expanded student edition, so the sub-agent pattern almost always applies. Use the same split/dispatch/merge flow from step 4 — just swap `prompts/remaster-chapter.md` → `prompts/remaster-teach.md` and point the output at `Chapter_${CHAPTER}_RemasteredTeach/`.

### Step 7 — solutions (mirror of `step_solutions()`)
- Input: `ctx.numbered_file` (numbered or numbered-teach depending on mode)
- Output: `..._Solutions.md` next to the numbered file
- Prompt: `prompts/solutions.md`
- **Idempotency** (file-level, mirror of `step_solutions:1190-1207`):
  1. If `ctx.solutions_file` (e.g. `..._Solutions.md`) exists, read IT and extract its PS blocks via `_extract_problem_sets()`
  2. If every block in that OUTPUT file contains `<!-- Solutions -->` AND `_output_fresh(solutions_file, numbered_file)` is True → skip the step entirely
  3. The per-block `<!-- Solutions -->` sentinel check inside the loop is a partial-run safety; the file-level check above is the primary skip path
- **Per-block procedure** (re-read `pipeline.py:_extract_problem_sets` and `step_solutions` if uncertain):
  1. Read input from `ctx.numbered_file` (NOT the solutions file — that's the output)
  2. Extract PS blocks via `_extract_problem_sets(lines)` → returns `list[tuple[start_line, end_line, text]]`
  3. **Process blocks in REVERSE order** by start line — each insertion shifts later indices
  4. Per block: count problems via `re.findall(r'\b(\d+)\)', block_text)` on the FULL block text (not per-line — multi-`<td>N)` lines exist in HTML tables). Falls back to bare `N)` line-start pattern for Chapter Review sections.
  5. Generate `<details>` blocks with `<summary>Problem N Solution</summary>` per `prompts/solutions.md`
  6. Splice into `output_lines` via `list.insert()` after splitting on `\n`. Do NOT track an offset accumulator.
  7. Write the spliced result to `ctx.solutions_file` (separate file — does NOT overwrite the numbered file)
- Lint: `_lint_solutions(solution_text, expected) -> (ok, msg, actual_count)` at `pipeline.py:1405`. Checks `<details>` count == expected, every `<summary>` present, no unclosed tags.
- On hard-fail (`actual_count == 0`): skip the write entirely. On soft-fail (count > 0 but ≠ expected): write anyway — partial solutions beat none.
- **Sub-agent dispatch** (recommended when total problems ≥ 8, or ≥ 2 PS blocks): each PS block is independent — dispatch one sub-agent per block in a single parallel message. Each agent receives its block text + `prompts/solutions.md` and returns the `<details>` blocks for that block's problems. Main orchestrator then splices them in reverse order (same `list.insert()` logic). Works for small cases too but overhead isn't worth it below ~8 problems total.

### Step 8 — youtube (mirror of `step_youtube()`)
- Input: best of `..._Solutions.md > ..._Numbered.md > ..._Remastered.md`
- Output: `html/${SECTION}_video_queries.json`
- Prompt: `prompts/youtube-queries.md`
- Topic extraction: H2/H3 headers only, exclude {TOC, Problem Set, Summary, Exercises, Review, bare Example/Definition numbering}, cap 12. Use `_extract_topics_for_youtube(text)` at `pipeline.py:1647` if extracting yourself, OR just match its filter rules.
- Subject inference from project name → `"finite math" | "calculus" | "algebra" | "statistics" | <normalized fallback>`
- Output JSON shape: `{"queries": [{"query": "<phrasing>", "label": "<topic>"}, ...]}`
- Lint: strip code fences, parse JSON, require `queries` non-empty list with `query` + `label` keys per entry.

### Step 9 — math verify (mirror of `math_verify.py:run`)
- Input: best of `..._Solutions.md > ..._Numbered.md > ..._Remastered.md`
- Output: `..._MathVerify.md` next to input (e.g. `..._Solutions_MathVerify.md`)
- Procedure:
  1. **Deterministic pre-checks** (no AI). The functions are in `scripts/workflows/math_verify.py`:
     - `check_latex_delimiters(text) -> list[dict]` — finds unmatched `$`, unclosed `$$`, unmatched `{ }` inside math
     - `count_math_elements(text) -> dict` — display math count, inline math, definitions, examples, solutions
  2. Easiest path: shell out to math_verify.py's pre-check section by importing it inline:
     ```bash
     python3 -c "import sys; sys.path.insert(0, 'scripts/workflows'); from math_verify import check_latex_delimiters, count_math_elements; t = open('<input>').read(); import json; print(json.dumps({'issues': check_latex_delimiters(t), 'counts': count_math_elements(t)}))"
     ```
  3. **Prompt:** `prompts/math-accuracy.md` is what the external script looks for. **It does not exist** — `math_verify.py` has an inline fallback prompt. You also use the inline fallback (just write the report following the structure below).
  4. **Generate the report yourself**, structure it as required by `lint_report()` at `math_verify.py:300`:
     ```markdown
     # Math Verification Report — Section {SECTION}

     **Overall Assessment:** PASS | FAIL | NEEDS_REVIEW

     ## Executive Summary
     {2–3 sentences: what you checked, headline counts, any issues}

     ## Statistics
     - Display math: {n}
     - Inline math: {n}
     - Definitions: {n}
     - Examples: {n}
     - Solutions: {n}

     ## Pre-check findings
     {bulleted list from check_latex_delimiters, or "All delimiters balanced"}

     ## AI review
     {scan for: HTML tags inside math (`<sup>`, `<sub>`, `<em>`, etc. — the 8.3-run bug class);
      plain English in `\(...\)` (e.g., `\(MENU\)`, `\(STAT\)`, `\(dummy variable\)`);
      mismatched `{ }` braces; `\frac` arity; obvious arithmetic errors in worked solutions}
     ```
  5. **Lint:** `lint_report(report_text) -> (ok, msg)` at `math_verify.py:300` — requires `Overall Assessment:` line + `Executive Summary` section.
  6. **Sub-agent dispatch** (recommended when source > 800 lines OR display-math count > 30): `math_verify.py:_split_math_elements(text)` splits the source into individual math-element blocks (examples, definitions, solutions). Dispatch one sub-agent per block (or per coherent group of 5–10 blocks) with a focused "verify these spans" prompt. Each agent returns a list of issues; main orchestrator merges into the report's "AI review" section. Matches `math_verify.py`'s existing `ThreadPoolExecutor` pattern but at the in-session level.

### Step 10 — html (mirror of `step_html()`)
- Input: best of `..._Solutions.md > ..._Numbered.md > ..._Remastered.md`
- Output: `html/${SECTION}_*.html` (or `html_teach/...` in teach mode)
- Prompt: `scripts/workflows/prompts/create-html-body.md` (the body-fragment prompt — NOT `prompts/create-static-html.md`, that's the slideshow)
- **Use `html_gen.py --body-file` — this is the script's official in-session integration point**:
  1. **You** generate the body fragment per `create-html-body.md`. No `<html>`, `<head>`, `<body>`. Strip code fences if you wrap in any. Preserve LaTeX delimiters character-for-character (no `<sup>` injection inside math — the 8.3 bug).
  2. Write your body to a temp file. **Recommended: a project-relative path** like `_body_temp_${SECTION}.html` in repo root — works on Windows and Unix. (Avoid `/tmp/` — not writable in Windows bash on this machine; the project-root pattern matches the existing `_body_temp_8.2.html`-style files in git history.)
  3. Bash:
     ```bash
     python3 scripts/workflows/html_gen.py \
       --body-file _body_temp_8.4.html \
       --input "$PROJ/remastered/Chapter_8_Numbered/8.4_inference_for_the_slope_of_a_regression_line_Solutions.md" \
       --output "$PROJ/html/8.4_inference_for_the_slope_of_a_regression_line.html" \
       --video-queries "$PROJ/html/8.4_video_queries.json" \
       --theme default
     ```
     (Use the resolved slug, not a glob — bash will expand `*` BEFORE passing to Python, so `8.4_*_Solutions.md` only works if exactly one file matches.)
     `--body-file` skips the AI call entirely. The script handles: title extraction from input, `_unhtml_math_content` post-processing (repairs `<sup>N</sup>` → `^{N}` inside math), `build_template_from_partials` template wrap, video-queries injection.
  4. After it returns, the file at `--output` is the final HTML.
- Lint: `_lint_html(html_text) -> (ok, issues)` at `pipeline.py:1470` — checks `<html>` present, `<body>` present, no `{content}`/`{title}` placeholders, length ≥ 100, balanced `<details\b` count.
- Correction loop: if lint fails, edit your body file (most failures are body-content issues, not template), re-run html_gen.py, re-lint.
- **Sub-agent dispatch for body generation** (recommended when input > 15,000 chars, matching `html_gen.py:HTML_CHUNK_THRESHOLD`): split the solutions markdown on H2 boundaries (same `find_split_points` as remaster). Dispatch one sub-agent per H2 section to produce its portion of the body fragment per `create-html-body.md`. Each agent receives the section markdown + the prompt + the running problem counter (so global `<div class="problem" id="problem-X-Y-N">` IDs don't collide). Main orchestrator concatenates the fragments, writes to `_body_temp_${SECTION}.html`, then calls `html_gen.py --body-file` once to wrap the template. Phase A's global `renumber_problems` rewrites problem labels afterward, so the sub-agents don't need to count across chunks.

### Step 11 — fixup (mirror of `step_fixup()`)

**Phase A — 5 deterministic functions, always run** (all in `pipeline.py`):
1. `_lint_fix_markdown_heading_divs(html) -> (html, n_fixed)` — convert `<div># heading</div>` → proper `<hN>`
2. `_lint_remove_chunk_markers(html) -> (html, n_fixed)` — strip AI chunk markers
3. `_lint_deduplicate_ids(html) -> (html, n_fixed)` — dedupe `id="..."` attributes
4. `_lint_renumber_problems(html) -> (html, n_fixed)` — renumber to "Problem K: Title."
5. `_lint_move_post_ps_examples(html) -> (html, n_moved)` — move stray example blocks before the problem set

Easiest invocation:
```bash
python3 -c "import sys; sys.path.insert(0, 'scripts/workflows'); from pipeline import _lint_fix_markdown_heading_divs as f1, _lint_remove_chunk_markers as f2, _lint_deduplicate_ids as f3, _lint_renumber_problems as f4, _lint_move_post_ps_examples as f5; p='<html-path>'; h=open(p).read(); 
for fn in [f1,f2,f3,f4,f5]: h,_=fn(h)
open(p,'w').write(h)"
```
(Or extract the 5 functions into a `fixup_phase_a.py` standalone helper — small follow-up patch.)

Note: importing `pipeline` will pull `from ai_client import AIClient` at the top. To avoid that side effect, the cleanest fix is to extract the 5 Phase A functions into a separate module. For first-pass use: just import — no AI calls happen unless you actually invoke a step function.

**Phase B — AI repair, only if Phase A flagged residual issues**:
1. After Phase A, run `_verify_html(html) -> (hard_fail, critical, warnings)` at `pipeline.py:2439` (NOT `_lint_html`)
2. If `warnings` contains either `"blockquote used as problem container"` or `"Stray markdown heading div"`:
   - Read `scripts/workflows/prompts/fix-html-block.md`
   - **You** apply the targeted repair to the affected HTML chunk yourself
3. Idempotent: re-running with no issues exits success/skipped.

### Step 13 — publish (mirror of `step_publish()`, includes verify)

**Phase 1 — verify** (always runs unless `.verify_ok` stamp is fresh):
- `_verify_html(html) -> (hard_fail, critical, warnings)` at `pipeline.py:2439`
- 7-phase check: security (no `polyfill.io`), structure (`<body>`, balanced tags), navigation (nav classes), content classes, solutions (`<details class="solution">`), math (delimiters intact), placeholders (no `{content}`/`{title}`)
- On `hard_fail`: stop pipeline, return error
- On clean: write `<section_id>_*.verify_ok` stamp (2-byte file) next to the HTML

**Phase 2 — publish**:
- `python3 scripts/workflows/publish.py --project "$PROJECT"` (add `--teach` to publish to `docs/teach/<slug>/` instead of `docs/<slug>/`)
- Idempotent: skips if `docs/<slug>/${SECTION}_*.html` is newer than the source

## Concrete walkthrough — section 8.4 (Introduction to Stats)

State on disk (8.4 is fully done; this scenario re-runs from clean):

```
projects/Introduction to Stats/
├── remastered/
│   ├── Chapter_8_Source/8.4_inference_for_the_slope_of_a_regression_line.md      (2987 lines)
│   ├── Chapter_8_Remastered/8.4_*.md
│   ├── Chapter_8_RemasteredTeach/8.4_*.md       (teach edition)
│   ├── Chapter_8_Numbered/8.4_*.md, _Solutions.md, _Solutions_MathVerify.md
│   └── Chapter_8_NumberedTeach/8.4_*.md, _Solutions.md, _Solutions_MathVerify.md
├── html/8.4_*.html, 8.4_*.verify_ok, 8.4_video_queries.json
└── html_teach/8.4_*.html
```

Re-run from clean (no skips), non-teach:

1. **Steps 1–3** — skip (source already extracted; merged JSON not newer)
2. **remaster** — Read `Chapter_8_Source/8.4_*.md` (2987 lines) + `prompts/remaster-chapter.md`. Generate Student Enhanced Edition in one pass. Write to `Chapter_8_Remastered/8.4_*.md`. Bash `python3 scripts/workflows/lint_remaster.py --input <output> --source <input> --json` → if score < 75, edit + re-lint.
3. **number** — `python3 scripts/workflows/number.py --input "$PROJ/remastered/Chapter_8_Remastered/8.4_*.md" --output "$PROJ/remastered/Chapter_8_Numbered/8.4_*.md" --chapter 8`
4. **solutions** — Find Problem Set blocks via `_extract_problem_sets`. Reverse iteration. Generate `<details>` per `prompts/solutions.md`. Lint via `_lint_solutions`. Write `..._Solutions.md`.
5. **youtube** — Extract H2/H3 topics from `..._Solutions.md`, apply `prompts/youtube-queries.md`, write `html/8.4_video_queries.json`.
6. **math** — Run pre-checks via inline import. Write `..._Solutions_MathVerify.md` per the structure above. Lint via `lint_report`.
7. **html** — Generate body. Write to `/tmp/8.4_body.html`. Bash `html_gen.py --body-file /tmp/8.4_body.html --input <solutions.md> --output html/8.4_*.html --video-queries html/8.4_video_queries.json`. Lint via `_lint_html`.
8. **fixup** — Phase A all 5 functions. Phase B only if `_verify_html` flagged a fixable warning.
9. **stitch** — `python3 scripts/workflows/stitch_chapter_html.py --sections 8.1 8.2 8.3 8.4 --html-dir "$PROJ/html" --output "$PROJ/html/Chapter_8_assembled.html" --chapter-title "Chapter 8" --project "Introduction to Stats"`
10. **publish** — Verify via `_verify_html`, write stamp, then `python3 scripts/workflows/publish.py --project "Introduction to Stats"`.

## Skip-if-fresh helper

Same as `_output_fresh()` at `pipeline.py:69`. Inline:
```bash
python3 -c "from pathlib import Path; o=Path('$OUT'); ins=[Path(p) for p in '''$IN1
$IN2'''.strip().splitlines()]; print('FRESH' if o.exists() and all(o.stat().st_mtime>=i.stat().st_mtime for i in ins if i.exists()) else 'STALE')"
```

## What you do NOT do (vs external pipeline)

- Do NOT call `AIClient.generate()` — directly or via any helper that imports `ai_client`
- Do NOT run `pipeline.py` — you ARE pipeline.py
- Do NOT spawn `claude` as a subprocess — use the Agent tool instead when you need parallel workers (see sub-agent patterns in steps 4, 5, 7, 9, 10)
- Do NOT chunk on size for short inputs — below 800 lines, do the whole section in one pass. Chunk *only* when the source exceeds the step's threshold (see per-step notes), and prefer sub-agent parallelism over sequential chunk loops.
- Do NOT pass `--provider`, `--model`, `--api-key` flags to any helper script (those routes go to AIClient)
- Do NOT invoke the existing standalone `book-*` skills for AI steps — those describe external paths and would defeat the purpose. The orchestrator (this file) is self-contained.

## Cross-references

- Reference implementation: `scripts/workflows-external/pipeline.py` — when behavior is unclear, read the matching `step_*()` function
- Helper scripts (deterministic kernel, used unchanged): `scripts/workflows/`
- Frozen external pipeline (with all AIClient calls intact) is `book-pipeline-external` skill
