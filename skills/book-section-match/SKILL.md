---
name: book-section-match
description: Use when matching sections between primary and supplementary textbooks to determine pedagogical fit, especially before merging content from multiple sources.
disable-model-invocation: true
---

# Book Section Match

> Match sections between a primary textbook and supplementary textbooks using AI-assisted semantic analysis. Evaluates pedagogical fit (not just topic similarity) and produces a mapping JSON that drives deterministic merging in book-merge.

## Prerequisites
- bookSHelf project at `C:\Users\shuff\Documents\GitHub\bookSHelf`
- Both primary and supplemental textbooks extracted as JSON (via book-scrape)
- AI provider configured (env vars or explicit args)

## When to Use
- Preparing to merge content from multiple textbook sources
- Need to determine where supplemental content fits in a primary textbook
- Building a mapping file before running book-merge

## When NOT to Use
- Only one source textbook (no matching needed, skip to book-remaster)
- Mapping already exists and doesn't need updating

## Guardrails

> ⚠️ **Must NOT:**
> - Run without both primary and supplemental JSON files
> - Use topic similarity alone - evaluate pedagogical fit per the prompt
> - Skip confidence threshold filtering

## Quick Start
1. Verify both JSON textbook files exist
2. Run mapping.py to produce mapping_results.json
3. Review matches above threshold
4. Feed mapping to book-merge

## Workflow

### Phase 1: Validate Inputs
- **INPUT:** Primary JSON path, supplemental JSON path
- **ACTION:** Verify both files exist and contain section data
- **OUTPUT:** Confirmed paths and section counts

### Phase 2: Run Section Matching
- **INPUT:** Validated file paths, confidence threshold (default 0.5)
- **ACTION:** Run mapping script
```bash
cd C:\Users\shuff\Documents\GitHub\bookSHelf && python scripts/workflows/mapping.py --input "{primary.json}" --supplemental "{supp.json}" --output mapping_results.json --threshold 0.5
```
- **OUTPUT:** mapping_results.json with match objects containing supplemental, primary, category, placement, confidence, reason

### Phase 3: Review Results
- **INPUT:** mapping_results.json
- **ACTION:** Show summary table of matches grouped by confidence tier. Flag NO_MATCH entries.
- **OUTPUT:** User-reviewed mapping ready for book-merge

## Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `bookSHelf/scripts/workflows/mapping.py` | AI section matching | `--input PRI --supplemental SUPP --output OUT` | JSON mapping results |

## Error Handling

| Problem | Action |
|---------|--------|
| Missing JSON input files | Run book-scrape first to generate them |
| AI provider not configured | Check env vars or pass --provider --model explicitly |
| All sections NO_MATCH | Lower threshold or review if supplemental book is appropriate |
| Script import error | Ensure section_matching.py module exists in workflows/ |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Matching by topic similarity alone | Use pedagogical fit categories: prerequisite, extension, application, alternative, practice, bridge |
| Using too high threshold | Start at 0.5; lower to 0.3 for broad matching |
| Skipping review | Always review mapping before feeding to book-merge |
