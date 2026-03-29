---
name: book-merge
description: Use when merging content from multiple textbook sources into a single chapter, especially after section matching has produced a mapping file and before remastering.
disable-model-invocation: true
---

# Book Merge

> Merge content from a primary textbook with supplemental textbook material using pre-computed section mappings. Supports both simple append mode and AI-assisted interleaving for intelligent content ordering. The primary text is preserved exactly; supplemental content is inserted at mapped locations.

## Prerequisites
- bookSHelf project at `C:\Users\shuff\Documents\GitHub\bookSHelf`
- Primary and supplemental textbook JSON files
- mapping_results.json from book-section-match
- For AI interleave: AI provider configured

## When to Use
- After book-section-match has produced mapping results
- Combining primary textbook with supplemental material
- Need to integrate content from multiple sources before remastering

## When NOT to Use
- Only one source textbook (skip to book-remaster)
- Mapping doesn't exist yet (run book-section-match first)
- Content already merged for this chapter

## Guardrails

> ⚠️ **Must NOT:**
> - Modify primary text content - it is sacred and preserved 100%
> - Run without a mapping file from book-section-match
> - Remove or reorder primary content
> - Skip source attribution on merged content

## Quick Start
1. Verify mapping_results.json exists from book-section-match
2. Run merge.py with basic mode first
3. Optionally re-run with --ai-interleave for intelligent ordering
4. Review merged output before passing to book-remaster

## Workflow

### Phase 1: Validate Inputs
- **INPUT:** Primary JSON, supplemental JSON, mapping_results.json
- **ACTION:** Verify all three files exist and mapping references valid sections
- **OUTPUT:** Confirmed paths and chapter to merge

### Phase 2: Basic Merge
- **INPUT:** Validated file paths
- **ACTION:** Run merge script in append mode
```bash
cd C:\Users\shuff\Documents\GitHub\bookSHelf && python scripts/workflows/merge.py --input "{primary.json}" --supplemental "{supp.json}" --mapping mapping_results.json --output merged.md
```
- **OUTPUT:** merged.md with supplemental content appended at mapped locations

### Phase 3: AI Interleave (Optional)
- **INPUT:** Same inputs + AI provider config
- **ACTION:** Re-run with AI-assisted interleaving for intelligent content ordering
```bash
cd C:\Users\shuff\Documents\GitHub\bookSHelf && python scripts/workflows/merge.py --input "{primary.json}" --supplemental "{supp.json}" --mapping mapping_results.json --output merged.md --ai-interleave --provider anthropic --model claude-sonnet-4-5
```
- **OUTPUT:** merged.md with intelligently ordered content blocks

### Phase 4: Verify Merge
- **INPUT:** merged.md
- **ACTION:** Check that all primary content is preserved, source tags present on every element
- **OUTPUT:** Verification confirmation

## Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `bookSHelf/scripts/workflows/merge.py` | Deterministic merge with optional AI interleave | `--input PRI --supplemental SUPP --mapping MAP --output OUT` | JSON + markdown merged output |

## Error Handling

| Problem | Action |
|---------|--------|
| Mapping file missing | Run book-section-match first |
| Section IDs don't match | Verify JSON files match the mapping |
| Primary content altered | Re-run merge - primary must be 100% preserved |
| Missing source tags | Add attribution manually to untagged content |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running without mapping | Always run book-section-match first |
| Forgetting source attribution | Every Definition, Example, Try It Now, Problem Set needs a Source tag |
| Using AI interleave without review | Always review AI-ordered output |
| Merging already-merged content | Check if merged output already exists |
