---
name: book-html-gen
description: Use when converting remastered markdown textbook content to styled interactive HTML pages with scroll-snapping, MathJax, navigation, dark mode, and collapsible solutions.
disable-model-invocation: true
---

# Book HTML Gen

> Convert remastered markdown textbook sections into self-contained static HTML pages. Uses a template system with CSS partials for styling, MathJax for math rendering, scroll-snap for slide-like navigation, and collapsible details elements for solutions. Supports both Claude-converted body content and legacy AI API conversion.

## Prerequisites
- bookSHelf project at `C:\Users\shuff\Documents\GitHub\bookSHelf`
- Remastered markdown file (from book-remaster)
- Template partials in `bookSHelf/scripts/workflows/templates/`

## When to Use
- After book-remaster has produced enhanced markdown
- After book-math-verify confirms content is correct
- Converting remastered sections to publishable HTML pages

## When NOT to Use
- Content hasn't been remastered yet (run book-remaster first)
- Math errors haven't been verified (run book-math-verify first)
- Only need to verify existing HTML (use book-verify)

## Guardrails

> ⚠️ **Must NOT:**
> - Include polyfill.io references (compromised CDN - CRITICAL security issue)
> - Use absolute filesystem paths in HTML output
> - Skip MathJax inclusion for math-containing content
> - Produce HTML without navigation elements
> - Generate HTML body directly in SKILL.md - use the html_gen.py script

## Quick Start
1. Ensure remastered markdown exists and passes math verification
2. Convert markdown body to HTML (Claude does this part)
3. Run html_gen.py to assemble with template
4. Verify output with book-verify

## Workflow

### Phase 1: Prepare Body Content
- **INPUT:** Remastered markdown file
- **ACTION:** Convert markdown to HTML body content following these rules:
  - Each `## Section Title` becomes a new `<section class="page-section">`
  - Math expressions `$...$` and `$$...$$` preserved for MathJax
  - Examples wrapped in `<div class="example">` with `<div class="example-title">`
  - Definitions wrapped in `<div class="definition">` with `<div class="definition-title">`
  - Solutions use `<details class="solution"><summary>...</summary><div class="solution-content">...</div></details>`
  - Problems wrapped in `<div class="problem">`
  - Insight notes in `<div class="insight-note">`
  - Context pauses in `<div class="context-pause">`
  - All elements need proper id attributes for TOC navigation
- **OUTPUT:** HTML body content file

### Phase 2: Assemble HTML Page
- **INPUT:** HTML body file, section title
- **ACTION:** Run html_gen.py to combine body with template:
```bash
cd C:\Users\shuff\Documents\GitHub\bookSHelf && python scripts/workflows/html_gen.py --body-file "{body.html}" --input "{section.md}" --output "{section.html}"
```
- **OUTPUT:** Complete self-contained HTML file

### Phase 3: Post-Processing
- **INPUT:** Generated HTML file
- **ACTION:**
  - Verify no polyfill.io references
  - Check all `<details>` have `class="solution"`
  - Verify MathJax script present
  - Check all images have valid relative paths
  - Verify TOC links match element IDs
- **OUTPUT:** Clean HTML ready for book-verify

## Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `bookSHelf/scripts/workflows/html_gen.py` | Assemble HTML from body + template | `--body-file BODY --input MD --output HTML` | Complete HTML page |
| `bookSHelf/scripts/workflows/chunk_html.py` | Pre-process markdown into chunks | markdown file | Chunked content |

## Required CSS Classes

| Element | Required Class | Container |
|---------|---------------|-----------|
| Learning objectives | `.learning-objectives` | `<div>` |
| Context pause boxes | `.context-pause` | `<div>` |
| Insight notes | `.insight-note` | `<div>` |
| Definitions | `.definition` + `.definition-title` | `<div>` |
| Examples | `.example` + `.example-title` | `<div>` |
| Important rules | `.important-rule` | `<div>` |
| Problem sets | `.problem-set` | `<div>` or `<section>` |
| Individual problems | `.problem` | `<div>` |
| Solutions | `details.solution` | `<details>` |

## Error Handling

| Problem | Action |
|---------|--------|
| polyfill.io found in output | Remove immediately - security vulnerability |
| Missing solution class on details | Add `class="solution"` to all `<details>` elements |
| Broken image paths | Convert to relative paths from HTML file location |
| MathJax not rendering | Check `$` delimiters preserved correctly in HTML |
| Template partials missing | Verify `bookSHelf/scripts/workflows/templates/` exists |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `<details>` without `class="solution"` | ALWAYS add `class="solution"` - CSS depends on it |
| Absolute filesystem paths in images | Use relative paths from the HTML output location |
| Including polyfill.io | Use MathJax CDN directly, no polyfill needed |
| Missing anchor IDs for TOC | Every h2 and example/problem div needs an id attribute |
| Skipping post-processing verification | Always check output for common bugs before publishing |
