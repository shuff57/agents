---
name: book-remaster
description: Use when rewriting or enhancing textbook sections for clarity and engagement in the Student Enhanced Edition format, especially after merging or as the primary transformation step for single-source content.
disable-model-invocation: true
---

# Book Remaster

> Rewrite textbook sections into a "Student Enhanced Edition" that retains 100% mathematical substance while upgrading language, adding Context Pauses, Insight Notes, Try It Now exercises, and consistent formatting. Supports both monolithic (single AI call) and chunked (split-parallel-merge) modes based on file size.

## Prerequisites
- bookSHelf project at `C:\Users\shuff\Documents\GitHub\bookSHelf`
- Source markdown file (original or merged section)
- AI provider configured (env vars or explicit args)

## When to Use
- Transforming raw textbook content into Student Enhanced Edition format
- After book-merge has combined sources (remaster the merged output)
- Single-source textbook needing enhancement (skip merge, go straight to remaster)
- Re-remastering a section that needs quality improvements

## When NOT to Use
- Content is already remastered and passes quality checks
- Only math verification needed (use book-math-verify)
- Only HTML conversion needed (use book-html-gen)

## Guardrails

> ⚠️ **Must NOT:**
> - Remove any mathematical content from the original
> - Change section header format (must stay `# X.Y [Title]`)
> - Generate solutions (handled by separate pipeline step)
> - Skip source attribution on any Example, Definition, Try It Now, or Problem Set
> - Use chunked mode on files under 300 lines (wastes tokens)

## Quick Start
1. Identify the source markdown file
2. Script auto-selects mode: monolithic (<300 lines) or chunked (>300 lines)
3. Run remaster.py with the remaster prompt
4. Verify output against quality checklist

## Workflow

### Phase 1: Assess Input
- **INPUT:** Source markdown file path
- **ACTION:** Check file size and line count to determine mode
  - Files > 300 lines OR > 50KB: chunked mode
  - Files ≤ 300 lines AND ≤ 50KB: monolithic mode
- **OUTPUT:** Selected mode and file statistics

### Phase 2: Execute Remaster
- **INPUT:** Source file, mode decision
- **ACTION:** Run remaster script
```bash
cd C:\Users\shuff\Documents\GitHub\bookSHelf && python scripts/workflows/remaster.py --input "{source.md}" --output "{remastered.md}" --prompt prompts/remaster-chapter.md
```
Optional flags:
- `--chunked` to force chunked mode
- `--no-chunked` to force monolithic mode
- `--provider anthropic --model claude-sonnet-4-5` for specific AI
- **OUTPUT:** Remastered markdown file

### Phase 3: Quality Check
- **INPUT:** Remastered output
- **ACTION:** Verify against quality checklist:
  - [ ] All section headers follow `# X.Y [Title]` format
  - [ ] All Examples use unified numbering: `Example C.N`
  - [ ] All Definitions use unified numbering: `Definition C.N: [Term]`
  - [ ] All Try It Now exercises use unified numbering: `Try It Now C.N`
  - [ ] Every Example, Definition, Try It Now, Problem Set has `**Source:**` tag
  - [ ] All images preserved with original syntax
  - [ ] All LaTeX math preserved (inline `$...$`, block `$$...$$`)
  - [ ] Insight Notes use blockquote format
  - [ ] Context Pauses explain real-world relevance
  - [ ] Key rules in callout boxes
  - [ ] Table of Contents present
  - [ ] No original content removed
- **OUTPUT:** Quality assessment pass/fail with specific issues

### Phase 4: Fix Issues (if needed)
- **INPUT:** Quality check failures
- **ACTION:** Fix specific issues and re-verify
- **OUTPUT:** Clean remastered file passing all checks

## Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `bookSHelf/scripts/workflows/remaster.py` | Remaster with auto mode selection | `--input SRC --output OUT --prompt PROMPT` | Remastered markdown |
| `bookSHelf/scripts/workflows/remaster_chunked.py` | Chunked mode backend | Called by remaster.py | Chunked remaster output |

## Error Handling

| Problem | Action |
|---------|--------|
| AI truncates output | Switch to chunked mode with smaller chunks |
| Missing source tags | Add them manually, mark as "Source: Main Text" if inferrable |
| Broken LaTeX | Preserve original and add comment: `<!-- Math notation unclear -->` |
| Image paths broken | Preserve original path, add: `<!-- Image path may need verification -->` |
| Numbering inconsistent | Apply unified C.N numbering ignoring source section numbers |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Generating solutions in Problem Sets | Do NOT generate solutions - handled by separate step |
| Changing `# X.Y` header format | Headers MUST stay as `# X.Y [Title]` for splitting script |
| Using monolithic mode on large files | Let auto-detection choose or force --chunked |
| Missing Context Pauses | Every complex term/formula needs a "why it matters" pause |
| Skipping Try It Now exercises | Each major concept needs a practice exercise with collapsible solution |
