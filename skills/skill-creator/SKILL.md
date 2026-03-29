---
name: skill-creator
description: Use when creating or rewriting an agent skill so the output follows the gold standard SKILL.md format, code-first patterns, and placement conventions.
---

# Skill Creator

> Standardizes how skills are authored so every skill is predictable, searchable, token-efficient, and safe to run. Interviews the user, decides whether the skill needs scripts, then produces a complete skill directory. The core principle: **SKILL.md orchestrates, scripts execute**.

## Prerequisites
- Write access to the skills directory
- Confirmed skill intent from user
- Destination: `~/.claude/skills/{name}/SKILL.md` (personal) or `.claude/skills/{name}/SKILL.md` (project)

## When to Use
- User asks to create a new skill
- User asks to rewrite/normalize an existing skill to standard format
- A plan task requires generating a SKILL.md template-compliant skill

## When NOT to Use
- User asks to execute a skill action immediately without authoring a new skill
- User asks only for a quick tip instead of reusable skill documentation

## Guardrails

> ⚠️ **Must NOT:**
> - Auto-create or save a skill without explicit user confirmation of the final draft
> - Put data-heavy logic in SKILL.md that belongs in a script
> - Hardcode absolute paths — use `${CLAUDE_SKILL_DIR}` for script references
> - Skip the code-first decision in Phase 2

## Interview

Collect these inputs before drafting:

| # | Field | Required | Example |
|---|-------|----------|---------|
| 1 | **Skill name** | Yes | `news-scraper` (kebab-case) |
| 2 | **Purpose** | Yes | "Scrape HN front page and return structured articles" |
| 3 | **Trigger phrases** | Yes | "get news", "scrape hacker news", "check HN" |
| 4 | **Tools/APIs used** | Yes | Playwriter, WebFetch, Bash |
| 5 | **Invocation model** | Yes | User-only, Claude-only, or both |
| 6 | **Execution context** | No | Inline (default) or fork to subagent |
| 7 | **Repeatable?** | No | Will this run repeatedly on the same data? |

If any required field is missing, ask only for missing fields.

## Format Rules (Mandatory)

### Structure rules
1. YAML `description` starts with **"Use when..."** and stays under 250 characters.
2. **Guardrails** section appears **before Workflow** for fail-fast visibility.
3. Each workflow phase uses clear **INPUT → ACTION → OUTPUT**.
4. **Error Handling** and **Common Mistakes** are always tables.
5. SKILL.md stays under **500 lines**; move overflow into `references/` files.
6. Cross-skill references use skill names, not file paths.

### Code-first rules
7. If a skill involves **data extraction, transformation, or repeated operations**, create a `scripts/` directory with executable scripts that do the heavy lifting.
8. Scripts must return **structured output** (JSON or filtered markdown) — never raw HTML or unfiltered page content.
9. Scripts define **strict output schemas** so the model doesn't waste tokens parsing structure.
10. Reference scripts via `${CLAUDE_SKILL_DIR}/scripts/` for portability.
11. Set **limits and stop conditions** in SKILL.md to prevent context flooding (max pages, max items, max tokens).

### Token efficiency rules
12. Pre-compute known values (selectors, URLs, schemas) in scripts — don't make the model discover them each run.
13. Design for **incremental runs** when the skill operates on data that changes over time.
14. Batch parallel operations in scripts rather than sequential model round-trips.

## Quick Start
1. Gather interview answers.
2. Decide: code-first or markdown-only.
3. Fill the template, create scripts if needed.
4. Save after user confirmation.

## Workflow

### Phase 1: Intake
- **INPUT:** User request to create/rewrite a skill
- **ACTION:** Run interview; normalize name to kebab-case; capture all fields
- **OUTPUT:** Complete skill specification

### Phase 2: Code-First Decision
- **INPUT:** Completed specification
- **ACTION:** Evaluate whether the skill needs scripts:

| Signal | → Scripts needed |
|--------|-----------------|
| Extracts data from web pages or APIs | Yes |
| Transforms or filters data before model sees it | Yes |
| Runs repeatedly on same/similar data | Yes |
| Involves >1 page of content returning to context | Yes |
| Needs pre-computed selectors, schemas, or configs | Yes |
| Pure knowledge/guidelines (style guide, conventions) | No — markdown only |
| Simple orchestration with existing tools | No — markdown only |

- **OUTPUT:** Decision: `code-first` or `markdown-only`, plus list of scripts to create

### Phase 3: Draft
- **INPUT:** Specification + code-first decision
- **ACTION:**
  - Fill all template sections; enforce format rules
  - If code-first: create script files that handle heavy lifting; SKILL.md orchestrates
  - Select appropriate frontmatter fields based on interview answers
  - Add limits/stop conditions for any skill that fetches external data
  - Add incremental-run pattern if skill is repeatable
- **OUTPUT:** Full skill directory draft (SKILL.md + scripts/ + references/)

### Phase 4: Validate
- **INPUT:** Draft skill directory
- **ACTION:**
  - Check frontmatter completeness and correctness
  - Verify section order and rule compliance
  - Confirm SKILL.md under 500 lines
  - Verify scripts return structured output, not raw data
  - Confirm no hardcoded absolute paths
  - Confirm limits/stop conditions present if skill fetches data
- **OUTPUT:** Confirmed final draft ready for save

## Error Handling

| Problem | Action |
|---------|--------|
| Missing triggers for description | Request trigger phrases and rewrite to start with "Use when..." |
| Name not kebab-case | Convert to lowercase hyphenated form and confirm |
| Workflow missing IO clarity | Rewrite each phase to explicit INPUT → ACTION → OUTPUT |
| Document too large | Move non-core detail to `references/` |
| Script returns raw HTML | Refactor script to filter and structure output |
| No limits on data-fetching skill | Add max-pages/max-items/max-tokens guardrail |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing description as "This skill does..." | Rewrite to "Use when..." with trigger conditions |
| Putting all logic in SKILL.md markdown | Move data-heavy logic into `scripts/`; SKILL.md orchestrates |
| Having model discover page structure each run | Pre-compute selectors in a script or reference file |
| Returning full page HTML to model context | Script filters to only relevant structured data |
| No stop condition on paginated scraping | Add `max_pages` or `max_items` limit in SKILL.md |
| Hardcoding `/Users/foo/...` paths | Use `${CLAUDE_SKILL_DIR}/scripts/` |
| Missing frontmatter for invocation control | Add `disable-model-invocation` or `user-invocable` as needed |

## Template

### Directory structure
```
{skill-name}/
├── SKILL.md                    # Orchestrator (required)
├── references/                 # Supplementary docs (optional)
│   └── {detail}.md
└── scripts/                    # Executable code (when code-first)
    └── {script}.{py|sh|js}
```

### SKILL.md scaffold

```markdown
---
name: {skill-name}
description: {One-line starting with "Use when...". Under 250 chars. Includes trigger phrases.}
# --- Invocation control (pick what applies) ---
# disable-model-invocation: true   # User-only: /skill-name to invoke
# user-invocable: false            # Claude-only: background knowledge
# --- Execution context (pick if needed) ---
# context: fork                    # Run in isolated subagent
# agent: Explore                   # Agent type for forked context
# --- Tool/model control (pick if needed) ---
# allowed-tools: Read, Grep, Bash(python *)
# model: sonnet                    # Override model for this skill
# effort: high                     # Override effort level
# --- Scope (pick if needed) ---
# paths: src/**/*.ts, lib/**/*.py  # Only activate for matching files
---

# {Skill Title}

> {2-3 sentence overview. What it does, why it exists, what it produces.}

## Prerequisites
- {Tool/permission/page required}

## When to Use
- {Trigger condition 1}
- {Trigger condition 2}

## When NOT to Use
- {Anti-trigger — use {other-skill} instead}

## Guardrails

> ⚠️ **Must NOT:**
> - {Forbidden action 1}
> - {Forbidden action 2}

## Limits
- Max pages/items: {N}
- Max tokens returned to context: {estimate}
- Stop condition: {when to halt}

## Quick Start
1. {Step 1}
2. {Step 2}
3. {Step 3}

## Workflow

### Phase 1: {Name}
- **INPUT:** {what this phase receives}
- **ACTION:** {what happens — reference scripts via ${CLAUDE_SKILL_DIR}/scripts/}
- **OUTPUT:** {structured result}

### Phase 2: {Name}
- **INPUT:** {Phase 1 output}
- **ACTION:** {next step}
- **OUTPUT:** {result}

## Scripts (if code-first)

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `scripts/{name}.py` | {what it does} | {args} | {JSON schema or markdown format} |

## Error Handling

| Problem | Action |
|---------|--------|
| {Error} | {Resolution} |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| {Mistake} | {Correction} |

## State Management (if repeatable)
- State file: `{path}`
- Incremental mode: check state before re-running; only process new items
- Resume: load previous checkpoint and continue from last completed item

## Selectors / References (optional)
{DOM selectors, API patterns, or link to references/ files}
```

## Output Placement

| Scope | Path |
|-------|------|
| Personal (all projects) | `~/.claude/skills/{name}/SKILL.md` |
| Project-only | `.claude/skills/{name}/SKILL.md` |
| Support files | `{skill-dir}/references/` |
| Scripts | `{skill-dir}/scripts/` |
| Domain knowledge | `{skill-dir}/knowledge.md` |
