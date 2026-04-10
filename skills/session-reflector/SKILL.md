---
name: session-reflector
description: Use when ending a work session or starting a new one to persist learnings in pending/ and keep agent memory current.
---

# Session Reflector

> Captures end-of-session learnings as flat markdown files in `.agents/memory/pending/`. No external dependencies — works with any setup. Indexing into a knowledge graph is optional and deferred.

## When to Use
- Session is ending and key learnings should be preserved
- New session is beginning and prior context should be recalled
- `pending/` contains unread reflection files from a prior session

## When NOT to Use
- One-off transient notes not meant to become durable memory
- Tasks requiring immediate action with no time for reflection

## Guardrails

> ⚠️ **Must NOT:**
> - Write to `.agents/memory/pending/` without explicit user confirmation [y/n]
> - Block session end waiting for any external service
> - Delete or move files from `pending/` unless explicitly archiving

## Workflow

### Phase 0: Draft + Confirm (Required)

1. Draft a reflection summary (≤30 lines) covering:
   - What was done (high-level completed work)
   - Patterns noticed (repeatable workflows or failure patterns)
   - Corrections received (what changed due to feedback)
   - Suggestions for skills or routing improvements

2. Ask the user (using the `question` tool in OpenCode, or bracketed text in other tools):

   > "Save these learnings to `.agents/memory/pending/`? [y/n/edit]"

3. On **y**: proceed to Phase 1.  
   On **edit**: show draft for revision, then proceed after confirmation.  
   On **n**: end cleanly with no changes.

### Phase 1: Write Reflection File

File path: `.agents/memory/pending/{YYYY-MM-DD}-{slug}.md`

**Naming**: slug = 2–4 kebab-case words summarizing the session (e.g. `auth-refactor-middleware`, `pdf-skill-debug`).

**Template:**
```markdown
# {YYYY-MM-DD} — {Session Title}

## What Was Done
- ...

## Patterns Noticed
- ...

## Corrections Received
- ...

## Suggestions
- ...
```

Write the file. Confirm written path to user. Done — no further steps required.

### Phase 2: Next Session Start — Recall Prior Learnings

At the start of a new session, check for `.md` files in `.agents/memory/pending/`:

```
ls .agents/memory/pending/
```

If files exist, read them and surface relevant context before starting work.

If the project uses a knowledge graph (e.g. LightRAG), indexing can be done separately — this skill does not require or assume it.

## State Management

| Location | Purpose |
|---|---|
| `.agents/memory/pending/{date}-{slug}.md` | Unread reflections — source of truth |
| `.agents/memory/pending/indexed/` | Optional archive after external indexing |

## Question Hook Conventions

### OpenCode (preferred)
Use the native **`question` tool** — renders a real UI dialog.

### Other tools (fallback)
Use bracketed text:
```
[QUESTION] Save learnings to .agents/memory/pending/? [y/n/edit]
```

## Automatic Behavior (via Sisyphus `prompt_append`)

Sisyphus is configured to automatically offer a session reflection at the end of every conversation. This means you typically do not need to invoke this skill manually — it will be prompted when the session winds down.

You can also trigger it manually at any time via the `/session-end` slash command.
