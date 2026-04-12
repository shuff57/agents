---
name: book-pipeline
description: Use when processing textbook sections through the full bookSHelf pipeline end-to-end, especially when converting source markdown to published HTML with approval checkpoints between stages.
disable-model-invocation: true
---

# Book Pipeline

> Drive the full bookSHelf pipeline via `scripts/workflows/pipeline.py` — an AI-agnostic Python orchestrator that makes direct API calls, writes files to disk, lints, and retries. No dependency on claude CLI, opencode, or any agent harness. The Electron app spawns it and reads the JSON progress stream.

## Architecture (as of 2025)

```
pipeline.py
    |
    ├── step_remaster()    → AIClient.generate() → lint_remaster.py → correction loop
    ├── step_number()      → subprocess: number.py
    ├── step_solutions()   → AIClient.generate() per Problem Set block
    ├── step_html()        → subprocess: html_gen.py (has its own AI call)
    ├── step_youtube()     → subprocess: youtube_lookup.py
    ├── step_verify()      → pure Python checks
    └── step_publish()     → subprocess: publish.py
```

Steps without their own script (`scrape`, `match`, `merge`, `math`) are delegated via `SUBPROCESS_STEPS` dict — they auto-skip if the script doesn't exist.

## Assembly Step (pre-remaster, book/chapter agnostic)

**Correct pipeline order:**
```
merge JSON (N fragments) → assemble per section → remaster per section → number → html
```
NOT: remaster all fragments → assemble. Assembling first saves tokens and produces cleaner remaster input.

Two scripts handle assembly. Both are fully book/chapter agnostic — driven by the merged JSON, no hardcoded titles or section numbers.

### assemble_chapter.py

Reads merged chapter JSON + per-fragment source .md files → assembles by merge_tier:
- `main` → keep in order
- `include` → fold in after preceding main fragment
- `borderline` → drop

**Three modes:**

```bash
# 1. Per-section files (recommended — feed each into pipeline remaster):
python3 scripts/workflows/assemble_chapter.py \
  --merged  "projects/Book/remastered/Merged/merged_ch1.json" \
  --src-dir "projects/Book/source/Chapter_1_Sections" \
  --output  "projects/Book/remastered/Chapter_1_Assembled_Sections" \
  --chapter 1 --mode sections

# 2. Per-section + chapter concat in one pass:
python3 scripts/workflows/assemble_chapter.py \
  --merged  "projects/Book/remastered/Merged/merged_ch1.json" \
  --src-dir "projects/Book/source/Chapter_1_Sections" \
  --output  "projects/Book/remastered/Chapter_1_Assembled_Sections" \
  --chapter 1 --mode sections --concat

# 3. After remastering all sections, stitch into chapter file:
python3 scripts/workflows/assemble_chapter.py \
  --src-dir "projects/Book/remastered/Chapter_1_Remastered_Sections" \
  --output  "projects/Book/remastered/Chapter_1_Remastered.md" \
  --chapter 1 --from-sections
```

Mode `--from-sections` picks up all `1.X_*.md` files from src-dir sorted numerically — no JSON needed. Use it after remastering to build the chapter-level file for number.py / html_gen.py.

Output filenames: `1.1_case_study_using_stents.md`, `1.2_data_basics.md` etc. — section number prefix + slugified title.

### split_chapter_sections.py

Alternative: split an already-assembled monolithic chapter .md back into per-section files. Uses the merged JSON for split-point detection (keyword match on first occurrence of each X.Y section header).

```bash
python3 scripts/workflows/split_chapter_sections.py \
  --input   "projects/Book/remastered/Chapter_1_numbered.md" \
  --output  "projects/Book/remastered/Chapter_1_Sections" \
  --chapter 1 \
  --merged  "projects/Book/remastered/Merged/merged_ch1.json"
```

Without `--merged`, falls back to auto-detection (first non-fragment `# X.Y` header). Auto-detection is unreliable on assembled files that have noisy fragment headers — always pass `--merged` when available.

### Pitfalls

- **Fragment headers look like section headers**: After assembly, a file may have `# 1.1 Guided Practice 1.1` alongside `# 1.1 Case study...`. The assembler/splitter uses keyword matching against the JSON titles, not just regex, to find true section boundaries.
- **html_gen.py sends entire file to AI in one call**: Don't pass a 300k-char chapter file. Use per-section files (25–85k chars each) for html_gen.
- **number.py resets counters per `# X.Y` header**: If multiple fragments share the same section prefix (e.g. `# 1.1 Guided Practice` inside section 1.2), numbering scopes may reset unexpectedly. Use `--from-sections` chapter concat after numbering to avoid this.
- **Slug deduplication**: The `latest_file_for_index()` function picks highest `_vN` suffix — if a dir has both `_v3.md` and `_v4.md` for the same fragment, only `_v4` is used.

## Prerequisites
- bookSHelf project at `/mnt/c/Users/shuff57/Documents/GitHub/bookSHelf`
- Source content available in `projects/{project}/remastered/*_Sections/`
- AI provider configured (see Provider Config below)
- `scripts/workflows/lint_remaster.py` present (used as remaster gate)

## Provider Config

Priority order (first wins):
1. CLI flags: `--provider`, `--model`, `--api-key`, `--base-url`
2. Environment variables: `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, etc.
3. `.env` file in project root (auto-loaded)

Supported providers via `ai_client.py`:
- `openai` — OpenAI or any OpenAI-compatible endpoint
- `ollama` / `ollama-local` / `ollama-cloud`
- `gemini`
- `copilot` — GitHub Copilot (claude-sonnet-4.6); reads OAuth token automatically from `~/.hermes/auth.json`. Use `--provider copilot --model claude-sonnet-4.6`. ~2-5 sec/call vs ~6-7 min for GLM cloud.
- Any unknown provider string — treated as OpenAI-compatible, reads `{PROVIDER}_BASE_URL`, `{PROVIDER}_API_KEY`, `{PROVIDER}_MODEL` from env

## Quick Start

```bash
cd /mnt/c/Users/shuff57/Documents/GitHub/bookSHelf

# Full pipeline, all steps
python3 scripts/workflows/pipeline.py \
  --project "Applied Finite Math" --section "5.3"

# Specific steps only
python3 scripts/workflows/pipeline.py \
  --project "Applied Finite Math" --section "5.3" \
  --steps "remaster,number,html"

# Start from a specific step (inclusive)
python3 scripts/workflows/pipeline.py \
  --project "Applied Finite Math" --section "5.3" \
  --from-step remaster

# Explicit provider
python3 scripts/workflows/pipeline.py \
  --project "Applied Finite Math" --section "5.3" \
  --provider ollama --model llama3.1 --base-url http://localhost:11434

# Dry run (no AI calls, validates paths and step order)
python3 scripts/workflows/pipeline.py \
  --project "Applied Finite Math" --section "5.3" \
  --dry-run
```

## All CLI Flags

| Flag | Description |
|------|-------------|
| `--project` | Project name (must match `projects/` subdirectory) |
| `--section` | Section ID, e.g. `5.3` |
| `--chapter` | Override chapter number (default: inferred from section) |
| `--steps` | Comma-separated steps to run (default: all 11) |
| `--from-step` | Start from this step inclusive |
| `--provider` | AI provider (overrides env) |
| `--model` | Model name (overrides env) |
| `--api-key` | API key (overrides env) |
| `--base-url` | API base URL (overrides env) |
| `--remaster-prompt` | Override path to remaster prompt file |
| `--solutions-prompt` | Override path to solutions prompt file |
| `--no-chunked` | Disable chunked mode for large sections |
| `--output-suffix` | Suffix appended before .md/.html on all outputs (e.g. `_v2`) — never overwrites originals, safe for comparison runs |
| `--dry-run` | Print steps without making any AI calls |

## Step Order and Weights

Steps run in this order. Progress bar is weighted by step cost:

| Step | Weight | Implementation |
|------|--------|----------------|
| scrape | 5% | subprocess: `scrape_concat.py` |
| match | 3% | subprocess: `section_matching.py` |
| merge | 8% | subprocess: `merge.py` |
| remaster | 25% | direct AIClient call + lint gate + correction loop |
| number | 5% | subprocess: `number.py` |
| solutions | 20% | direct AIClient call per Problem Set block |
| math | 10% | subprocess: `math_verify.py` |
| youtube | 5% | subprocess: `youtube_lookup.py` |
| html | 10% | subprocess: `html_gen.py` (has its own AI path) |
| verify | 5% | pure Python checks |
| publish | 4% | subprocess: `publish.py` |

## JSON Progress Stream

Every line to stdout is a JSON object. Electron app reads these via `pipeline:progress` IPC events.

```json
{"phase": "remaster", "progress": 14, "message": "Calling openai/gpt-4o (375 lines)...", "is_running": true}
{"phase": "remaster", "progress": 20, "message": "Lint score 62/100 — FAIL (try_it_now). Retrying...", "is_running": true, "lint_score": 62}
{"phase": "remaster", "progress": 22, "message": "After correction: 88/100 PASS", "is_running": true, "lint_score": 88}
{"phase": "Complete", "progress": 100, "message": "Pipeline complete: 3 steps | section 5.3", "is_running": false, "result": {...}}
{"phase": "Error", "progress": 0, "message": "Step 'remaster' raised: ...", "is_running": false, "error": "...", "step": "remaster"}
```

## Electron Integration

```js
// main.js — pipeline:run IPC handler spawns pipeline.py, parses JSON, emits pipeline:progress
// preload.js — exposes:
window.electronAPI.runPipeline({
  project: "Applied Finite Math",
  section: "5.3",
  steps: "remaster,number,html",   // optional
  provider: "openai",              // optional, overrides env
  model: "gpt-4o",                 // optional
  dryRun: false,
});

window.electronAPI.onPipelineProgress((update) => {
  // update = { phase, progress, message, is_running, lint_score?, result? }
});
```

Legacy `window.electronAPI.executePipelineStep()` still works for agent-CLI invocation (kept for backward compat).

## Remaster Step Detail

The remaster step has the most logic:
1. Load source file, count lines
2. Choose monolithic (<300 lines) or chunked (≥300 lines) mode
3. Call `AIClient.generate(prompt, source, temperature=0.3)`
4. Write output to `{section_slug}_Remastered.md`
5. Run `lint_remaster.py` — if score < 75 (FAIL):
   - Build correction prompt from failing rule details
   - Call AI again with `temperature=0.2`
   - Re-lint — emit score regardless of pass/fail
6. Emit `lint_score` and `lint_passed` on the final progress event

Chunked mode: splits on section headers, calls AI per chunk, merges. Falls back to monolithic if no split points found.

## Path Discovery

`ProjectContext` auto-discovers actual directory names by scanning `projects/{project}/remastered/`:
- Source dir: first subdir containing `_Sections` but NOT `_Remastered`
- Remastered dir: first subdir containing `_Remastered`

This is important — directory names are project-specific (e.g. `AppliedFiniteMath-3ed-Current_full_source_Sections`) not constructed from project name.

## Prompt Files

| Prompt | Path | Purpose |
|--------|------|---------|
| remaster | `prompts/remaster-chapter.md` | Main remaster instructions (184 lines, GOOD version) |
| solutions | `prompts/solutions.md` | Solutions generation (fallback inline prompt if missing) |
| html | `scripts/workflows/prompts/create-html-body.md` | HTML conversion |

**Critical:** Always use `prompts/remaster-chapter.md` (project root), NOT `scripts/workflows/prompts/remaster-chapter.md` (weak 147-line version). Pass `--remaster-prompt prompts/remaster-chapter.md` explicitly if in doubt.

## Lint Gate

The linter (`scripts/workflows/lint_remaster.py`) runs automatically after remaster:
- Threshold: 75/100 to pass
- 7 rules: try_it_now (25pt), source_attribution (20pt), math_delimiters (15pt), context_pauses (10pt), insight_notes (10pt), header_format (10pt), no_premature_solutions (10pt)
- Auto-detects if solutions pipeline already ran (skips premature-solutions check)

Run manually:
```bash
python3 scripts/workflows/lint_remaster.py \
  --input "projects/.../Section_Remastered.md" \
  --source "projects/.../Section.md"
# Add --json for machine-readable output
```

## Optimize Prompt (When Many Sections Fail)

If multiple sections fail lint with the same rules, run the optimizer instead of manual fixes:
```bash
python3 scripts/workflows/optimize_prompt.py \
  --prompt prompts/remaster-chapter.md \
  --target 95 --iterations 6
```
Runs remaster → lint → critic-AI-patch → repeat. Saves checkpoints per iteration to `prompts/optimization_runs/`. Locks winner to both prompt locations.

## Error Handling

| Problem | Action |
|---------|--------|
| Source file not found | Check `projects/{project}/remastered/` dir names — use `_find_dir` logic |
| AI returns empty/short response | Pipeline logs it and continues (doesn't crash) |
| Step script not found | Auto-skips with `success: True, skipped: True` |
| Lint fails after correction | Pipeline continues, emits lint_score — doesn't block |
| subprocess step fails (non-zero exit) | Pipeline stops, emits Error JSON |

## Step Optimization Status

| Step | Status | Notes |
|------|--------|-------|
| scrape | optimized | |
| match | optimized | |
| merge | optimized | |
| remaster | optimized | lint gate, correction loop, chunked mode, prompt optimizer |
| number | optimized | see number.py edge cases below |
| solutions | optimized | idempotency guard, problem counter, lint gate, correction loop (commit 7be21c9) |
| math | not optimized | subprocess only |
| youtube | not optimized | subprocess only |
| html | not optimized | AI call but no lint/correction loop |
| verify | not optimized | pure Python checks |
| publish | not optimized | deploy only |

## number.py — Known Element Patterns

The remaster step produces several variants that number.py must handle:

| Pattern | Form | Example |
|---------|------|---------|
| Example | `### Example 1.1` | heading, standard |
| Try It Now | `### Try It Now 1.1` | heading, standard |
| Try It Now | `**Try It Now — Title**` | bold text (no heading) — also `**Try It Now 1.1 — Title**` |
| Definition | `**Definition 1.1: Title**` | bold, colon-separated |
| Problem Set | `## Problem Set` or `### Problem Set` | may appear 2–5× in one section (continuation blocks) |
| TOC | `## Table of Contents` | h2 heading |
| TOC | `# Table of Contents` | h1 heading (some sections) |
| TOC | `**Table of Contents**` | bold text, no heading (some sections) |

Key behaviors (as of fix commit 62c902e):
- Bold Try It Now is converted to `### Try It Now X.Y.N` automatically
- Multiple Problem Set blocks in same section: first gets numbered, rest reuse same number
- TOC is preserved as-is; only bare `Problem Set` links are updated to `Problem Set X.Y`
- All outputs are idempotent (run twice = identical result)

## Solutions Step Detail

The solutions step generates worked solutions for every Problem Set block:

1. Load numbered (or remastered) file, extract all `### Problem Set` blocks via `_extract_problem_sets()`
2. **Process blocks in REVERSE order** — each insertion shifts line indices; processing last-to-first keeps all prior indices valid
3. **Idempotency guard**: if `<!-- Solutions -->` is already in the block text, skip it. After insertion the solutions become part of the block, so this check works on subsequent runs.
4. **Problem counter** (`_count_problems`): uses `re.findall()` on the full block text (not per-line) because multiple `<td>N)` entries can appear on one line in HTML table format. Falls back to bare `N)` line-start pattern for Chapter Review sections.
5. Call `AIClient.generate(prompt, ps_text, temperature=0.1)`
6. **Lint gate** (`_lint_solutions`): checks `<details>` count == expected, all have valid `<summary>Problem N Solution</summary>`, no unclosed tags
7. **Correction loop**: if lint fails, retry once with failure context appended to prompt
8. Splice insertion into `output_lines` list by splitting on `\n` and using `list.insert()` — do NOT append to the string then re-split, and do NOT track an offset accumulator (both approaches fail with multi-block sections)

### Pitfalls specific to solutions step

| Pitfall | Fix |
|---------|-----|
| Processing PS blocks forward with an offset accumulator | Offset only tracks the `\n` count in the insertion string — `output_lines` list size doesn't change until after the loop. Use **reverse order** instead. |
| `sum(1 for ln in lines if td_rx.search(ln))` for problem count | HTML tables often put 2+ `<td>N)` entries on one line. Use `td_rx.findall(ps_text)` on the full text. |
| Checking sentinel in lines after `end_line` | After insertion the solutions are INSIDE the block (block ends at the last `</details>`). Check `"<!-- Solutions -->" in ps_text` instead. |
| `insertion.count("\n")` as offset for list growth | The list doesn't grow — the insertion is embedded in one string element. Use `list.insert()` per line after splitting on `\n`. |

### Auditing a deterministic pipeline step

When asked to optimize a non-AI pipeline step (number, verify, etc.):
1. Read the script fully to understand its regex patterns and logic
2. Run it on all available real remastered sections: `for f in projects/.../Sections_Remastered/1.*.md`
3. Check element counts: source vs output should match (`grep -c "^### Example"`)
4. Check idempotency: run output through same script again, `diff` should be empty
5. Spot-check TOC, first/last elements, and any section with unusual structure (multi-problem-set, bold Try It Now, etc.)
6. Fix one issue at a time, re-run full suite after each fix
7. Commit with detailed message listing each bug fixed + verification method

## Pitfalls

| Pitfall | Fix |
|---------|-----|
| Assumed dir names don't match reality | ProjectContext scans actual dirs — don't construct paths from project name |
| `git status` hangs on WSL2+NTFS | Use `git log` or `git diff` instead |
| Chunked remaster used to bail out saying "Claude must intervene" | Old `remaster_chunked.py` design — `pipeline.py` handles chunking natively now |
| `detect_split_level()` returns int, not tuple | Fixed in pipeline.py — don't unpack as `level, _ = detect_split_level(...)` |
| `find_split_points()` returns `list[dict]` with `"line"` key, not tuple | Fixed: use `sp["line"]` not `sp[0]` when iterating split points |
| `lines` not defined in `_remaster_chunked` | Fixed: `lines = source_text.splitlines(keepends=True)` must be inside `_remaster_chunked`, not inherited from caller |
| Solutions step has no prompt file | Inline fallback is used automatically — add `prompts/solutions.md` for production |
| pipeline:execute still calls claude CLI | That's the LEGACY handler — use `pipeline:run` for the new AI-agnostic path |
| patch tool mangles regex strings in Python files | Use write_file to rewrite the entire script — patch tool double-escapes backslashes inside re.compile() strings |
