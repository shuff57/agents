---
name: skill-updater
description: Use when auditing and upgrading existing skills to match the current skill-creator standard — adds missing frontmatter, extracts scripts from markdown, applies token-efficiency patterns, and restructures directories.
disable-model-invocation: true
---

# Skill Updater

> Audits existing skills against the current skill-creator standard, identifies gaps (missing frontmatter, inline code that should be scripts, token waste, missing limits), and applies fixes. Produces a structured audit report first, then upgrades only after user approval.

## Prerequisites
- Read access to the skills directory being audited
- Write access to apply upgrades
- The current `skill-creator` SKILL.md as the reference standard

## When to Use
- "Update my skills", "audit skills", "upgrade skills to new format"
- After updating the skill-creator standard and wanting to bring existing skills in line
- When a skill is inefficient (too much inline code, no scripts, no limits)
- Periodic skill hygiene check

## When NOT to Use
- Creating a brand new skill from scratch — use `skill-creator` instead
- The skill is already compliant and no changes are needed
- User wants to delete or archive skills

## Guardrails

> ⚠️ **Must NOT:**
> - Apply any changes without showing the audit report and getting explicit user approval
> - Delete or rename existing skills without confirmation
> - Break working skills — preserve all existing functionality during restructure
> - Move scripts that are referenced by absolute path without updating all references
> - Auto-upgrade all skills in batch — process one at a time with approval

## Limits
- Max skills per audit run: 10 (present results, get approval, then continue)
- Audit report per skill: under 50 lines

## Quick Start
1. Run the audit script to scan skills and produce a gap report.
2. Review the report with the user — prioritize by impact.
3. Apply approved upgrades one skill at a time.

## Workflow

### Phase 1: Discover Skills
- **INPUT:** Skills directory path (default: `~/.claude/skills/`)
- **ACTION:** Run `${CLAUDE_SKILL_DIR}/scripts/audit.sh` to scan all skill directories and extract metadata.
- **OUTPUT:** List of skills with paths, line counts, and basic structure info

### Phase 2: Audit Against Standard
- **INPUT:** Discovered skills list
- **ACTION:** For each skill, check against these criteria:

| Check | Pass | Fail |
|-------|------|------|
| **Frontmatter** | Has `name` + `description` starting with "Use when..." | Missing or wrong format |
| **Invocation control** | Has `disable-model-invocation` or `user-invocable` if appropriate | Default when it shouldn't be |
| **Description length** | Under 250 chars | Over 250 chars (gets truncated) |
| **SKILL.md length** | Under 500 lines | Over 500 lines (needs splitting) |
| **Code-first check** | Data-heavy ops are in `scripts/`, not inline markdown | Large code blocks in SKILL.md that should be extracted |
| **Script output** | Scripts return structured JSON/markdown | Scripts return raw HTML or unfiltered data |
| **Token limits** | Has max-pages/items/tokens for data-fetching skills | No limits on external data |
| **Incremental runs** | Has state management if skill is repeatable | No state for repeatable skill |
| **Path portability** | Uses `${CLAUDE_SKILL_DIR}` or relative paths | Hardcoded absolute paths |
| **Section order** | Guardrails before Workflow | Guardrails after Workflow |
| **IO clarity** | Phases have INPUT → ACTION → OUTPUT | Missing structured IO |
| **Error/Mistakes tables** | Present as tables | Missing or wrong format |
| **Directory structure** | Has `scripts/` if code-first, `references/` if needed | Flat file with no supporting structure |

- **OUTPUT:** Audit report with pass/fail per check, grouped by severity

### Phase 3: Prioritize and Present Report
- **INPUT:** Raw audit results
- **ACTION:** Group findings into three tiers:

| Tier | Criteria | Examples |
|------|----------|---------|
| **Critical** | Broken functionality or major token waste | Hardcoded paths, raw HTML in output, no limits on scraping |
| **Important** | Missing standard features | No frontmatter, no invocation control, inline code → scripts |
| **Polish** | Cosmetic or minor improvements | Description too long, section order, missing IO labels |

Present the report as a table per skill showing tier, check name, current state, and recommended fix.

- **OUTPUT:** User-reviewed prioritized audit report

### Phase 4: Apply Upgrades (per skill, with approval)
- **INPUT:** Approved audit findings for one skill
- **ACTION:** Apply fixes in this order:
  1. **Directory restructure** — create `scripts/` and `references/` if needed
  2. **Extract scripts** — move inline code blocks from SKILL.md into `scripts/` files; replace with `${CLAUDE_SKILL_DIR}/scripts/` references
  3. **Fix frontmatter** — add missing fields, fix description format
  4. **Add limits** — insert Limits section for data-fetching skills
  5. **Add state management** — insert incremental-run pattern for repeatable skills
  6. **Fix paths** — replace hardcoded absolute paths with portable references
  7. **Fix section order** — move Guardrails before Workflow if needed
  8. **Add IO labels** — add INPUT/ACTION/OUTPUT to workflow phases
  9. **Split oversized SKILL.md** — move overflow to `references/`
- **OUTPUT:** Updated skill directory

### Phase 5: Verify
- **INPUT:** Updated skill
- **ACTION:**
  - Confirm SKILL.md under 500 lines
  - Confirm no hardcoded absolute paths remain
  - Confirm scripts return structured output
  - Confirm all cross-references are valid (files exist)
  - Diff the changes and present to user
- **OUTPUT:** Verified upgrade with diff summary

## Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `scripts/audit.sh` | Scan skill directories and extract metadata | Skills directory path | JSON array of skill metadata |

## Error Handling

| Problem | Action |
|---------|--------|
| Skill has no SKILL.md | Skip and report as "not a valid skill directory" |
| Script extraction would break functionality | Flag as manual-review instead of auto-extracting |
| Skill references files that don't exist | Report broken references in audit |
| Skill is a symlink | Follow the symlink to the source and audit/modify the source |
| User declines all upgrades for a skill | Skip it and move to the next |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Batch-upgrading all skills without review | Process one skill at a time with explicit approval |
| Extracting code that's documentation, not executable | Only extract code blocks that are meant to be run, not examples |
| Breaking relative references during restructure | Update all internal links after moving files |
| Adding frontmatter fields that don't apply | Only add fields relevant to the skill's invocation model |
| Treating all skills as code-first | Markdown-only skills (style guides, conventions) don't need scripts |
