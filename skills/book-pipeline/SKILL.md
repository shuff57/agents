---
name: book-pipeline
description: Use when processing textbook sections through the full bookSHelf pipeline end-to-end, especially when converting source markdown to published HTML with approval checkpoints between stages.
disable-model-invocation: true
---

# Book Pipeline

> Orchestrate the full bookSHelf textbook processing pipeline by delegating each stage to its specialized skill. Processes sections through: scrape → match → merge → remaster → math-verify → html-gen → verify → publish. Stops for explicit user approval between stages. Mirrors the gb-pipeline approval-gate pattern.

## Prerequisites
- bookSHelf project at `C:\Users\shuff\Documents\GitHub\bookSHelf`
- Source content available (scraped sections or existing markdown)
- All book-* skills available

## When to Use
- Processing a new textbook section from source to published HTML
- Running the full pipeline end-to-end with safety checkpoints
- User wants orchestrated workflow instead of running skills individually

## When NOT to Use
- Only one specific stage needed (use the individual skill directly)
- User wants silent automation without approval gates
- Debugging a specific pipeline step

## Guardrails

> ⚠️ **Must NOT:**
> - Skip the approval gate between any stage
> - Auto-advance after any stage, even if results look clean
> - Skip book-verify before book-publish
> - Skip book-math-verify before book-html-gen
> - Proceed if any stage reports errors without user acknowledgment
> - Hardcode file paths — derive all paths from project name and section ID

## Quick Start
1. Identify the project and section(s) to process
2. Determine starting point (smart detect based on existing files)
3. Run each stage with approval gates between them
4. Publish verified HTML to docs/

## Workflow

### Phase 1: Smart Detect Starting Point
- **INPUT:** Project name, section ID(s)
- **ACTION:** Check what already exists:
  - Source files in `projects/{project}/source_files/`?
  - Remastered files in `projects/{project}/remastered/`?
  - HTML files in `projects/{project}/html/`?
  - Determine which stages to skip vs run
- **OUTPUT:** Starting stage and file paths

### Phase 2: Stage 1 — Scrape & Concatenate (if needed)
- **INPUT:** Project name, source identifier
- **ACTION:** Invoke book-scrape skill
- **OUTPUT:** full_source.md in source_files/
- **GATE:** Show section count and ask user to continue

### Phase 3: Stage 2 — Section Match & Merge (if supplemental book exists)
- **INPUT:** Primary and supplemental JSON files
- **ACTION:**
  1. Invoke book-section-match to produce mapping
  2. Show mapping results and get approval
  3. Invoke book-merge with mapping
- **OUTPUT:** Merged markdown
- **GATE:** Show merge summary and ask user to continue
- **SKIP:** If single source (no supplemental), skip directly to Stage 3

### Phase 4: Stage 3 — Remaster
- **INPUT:** Source or merged markdown section
- **ACTION:** Invoke book-remaster skill
- **OUTPUT:** Remastered markdown in `remastered/` directory
- **GATE:** Show quality checklist results and ask user to continue

### Phase 5: Stage 4 — Math Verification
- **INPUT:** Remastered markdown
- **ACTION:** Invoke book-math-verify skill
- **OUTPUT:** Math accuracy report
- **GATE:** Show report summary. If CRITICAL issues found, must fix before continuing.

### Phase 6: Stage 5 — YouTube Videos (optional)
- **INPUT:** Remastered markdown section titles
- **ACTION:** Invoke book-youtube skill
- **OUTPUT:** Video query JSON files
- **GATE:** Show video count and ask user to continue (or skip)

### Phase 7: Stage 6 — HTML Generation
- **INPUT:** Verified remastered markdown
- **ACTION:** Invoke book-html-gen skill
- **OUTPUT:** HTML file in `projects/{project}/html/`
- **GATE:** Ask user to preview HTML before verification

### Phase 8: Stage 7 — HTML Verification
- **INPUT:** Generated HTML file
- **ACTION:** Invoke book-verify skill
- **OUTPUT:** Verification report (PASS/FAIL/WARNINGS)
- **GATE:** If FAIL, must fix before publishing. If PASS, ask to continue.

### Phase 9: Stage 8 — Publish
- **INPUT:** Verified HTML file
- **ACTION:** Invoke book-publish skill with --dry-run first
- **OUTPUT:** Published HTML in docs/ with index updated
- **GATE:** Show dry-run results, then execute after approval

### Phase 10: Pipeline Complete
- **INPUT:** All stage results
- **ACTION:** Produce final summary:
  - Section(s) processed
  - Stages completed
  - Files generated
  - Issues encountered and resolved
  - Published locations
- **OUTPUT:** Pipeline completion report

## Pipeline State

The pipeline tracks state in `projects/{project}/html/_pipeline_state.json`:

```json
{
  "project": "Project Name",
  "sections": [{
    "id": "5.5",
    "title": "Section Title",
    "steps": {
      "remaster": {"status": "completed", "completed_at": "..."},
      "number": {"status": "completed", "completed_at": "..."},
      "solutions": {"status": "completed", "completed_at": "..."},
      "math_check": {"status": "completed", "completed_at": "..."},
      "html": {"status": "completed", "completed_at": "..."},
      "verify": {"status": "completed", "completed_at": "..."},
      "publish": {"status": "completed", "completed_at": "..."}
    }
  }]
}
```

## Error Handling

| Problem | Action |
|---------|--------|
| Stage fails with errors | Stop pipeline, report errors, ask user how to proceed |
| Math verification finds CRITICAL | Must fix before continuing to HTML gen |
| HTML verification FAIL | Must fix before publishing |
| Missing prerequisite files | Report which stage needs to run first |
| Pipeline state corrupt | Rebuild state from existing files on disk |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping math verification | ALWAYS run book-math-verify before book-html-gen |
| Publishing without verification | ALWAYS run book-verify before book-publish |
| Not using smart detect | Check existing files to avoid re-running completed stages |
| Skipping approval gates | NEVER auto-advance — always ask user |
| Forgetting to commit after publish | Remind user to commit docs/ changes |
