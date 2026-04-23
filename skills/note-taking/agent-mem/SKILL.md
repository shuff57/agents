---
name: agent-mem
description: >
  Read and write persistent agent memory via the agent-mem git repo.
  Load context at session start. Save learnings during/after sessions.
  Triggers: "remember this", "save to memory", "load memory", "agent-mem",
  "sync memory", "persist this", "what do you know about X".
tags: memory, persistence, git, agent-mem
---

# agent-mem: Persistent Agent Memory

Flat markdown memory files in a git repo. All agents read/write across devices.

**Repo**: `https://github.com/shuff57/agent-mem`
**Local**: `/mnt/c/Users/shuff57/Documents/GitHub/agent-mem/`

## When to Use

- **Session start**: load global + project memory for context
- **During session**: save durable facts (user corrections, environment details, project conventions)
- **Session end**: commit + push any memory changes

## When NOT to Use

- Task progress, session outcomes → use `session_search`
- Rich detail needed on-demand → use `fact_store`
- Ephemeral scratch notes → use `memories/sessions/` (gitignored)

## Commands

### Load (session start or on demand)

```
1. cd /mnt/c/Users/shuff57/Documents/GitHub/agent-mem && git pull
2. Read ALL files in memories/global/ (user.md, environment.md, preferences.md, conventions.md)
3. If working in a project dir, read memories/projects/{project-name}.md
4. Summarize key context to user
```

### Save (during session, when durable fact learned)

```
1. Determine target file:
   - About the user/person? → memories/global/user.md
   - About machine/OS/tools? → memories/global/environment.md
   - About workflow prefs? → memories/global/preferences.md
   - About coding/agent conventions? → memories/global/conventions.md
   - About a specific project? → memories/projects/{name}.md
2. Edit the file: append new section or update existing section
3. Do NOT commit yet — accumulate changes, commit at session end
```

### Sync (session end)

```
1. cd /mnt/c/Users/shuff57/Documents/GitHub/agent-mem
2. git add -A
3. If changes staged: git commit -m "mem: {one-line summary}"
4. git push
```

## Memory File Format

Each `.md` file uses this structure:

```markdown
# [Topic]

> scope: global | project:{name}
> source: hermes | claude-code | copilot | manual
> updated: YYYY-MM-DD

## [Section]

Content here. Regular markdown.
```

- Frontmatter is optional YAML-like header in a blockquote
- Keep entries concise — memory files are read in full each session
- Use grep/search for specific queries within memory files

## File Routing

| Content | Target File |
|---------|-------------|
| User identity, communication style | `global/user.md` |
| Machine, OS, paths, tools, gotchas | `global/environment.md` |
| Workflow preferences, tool keep/drop | `global/preferences.md` |
| Agent rules, skill conventions | `global/conventions.md` |
| Project-specific pipeline, quirks, status | `projects/{name}.md` |
| Ephemeral session scratch | `sessions/` (gitignored) |

## Guardrails

- **NEVER** commit secrets, API keys, or tokens
- **NEVER** force push — other devices may have commits
- **Always** `git pull` before writing to avoid conflicts
- Keep memory files under 200 lines each — prune or split when bloated
- Run `scripts/sync.sh` as a shortcut for pull + commit + push

## Relationship to Other Memory Systems

| System | Purpose | Injected? |
|--------|---------|-----------|
| `agent-mem` (this skill) | Durable, cross-session, cross-agent facts | No — load explicitly |
| Hermes `memory` tool | Always-on pointers, injected every turn | Yes |
| Hermes `fact_store` | On-demand structured recall with trust scores | No — query explicitly |
| `session_search` | Past session transcripts | No — search explicitly |

**Rule**: Hermes `memory` = pointers (under 150 chars). `agent-mem` = full context. `fact_store` = structured data.

## Obsidian Mirror

The `memories/` directory is junctioned into the Obsidian vault at:

```
C:\Users\shuff57\Documents\Obsidian Vault\Agent Memory\  →  agent-mem\memories\
```

- Edits in Obsidian write directly to the git repo (via junction)
- Edits via git push appear in Obsidian immediately (same filesystem)
- `memories/Index.md` provides a wikilink nav hub inside Obsidian
- Obsidian MCP search may need a re-index after adding new files
- To create: `New-Item -ItemType Junction -Path '<vault>\Agent Memory' -Target '<repo>\memories'`

## Pitfalls

- WSL path: repo is at `/mnt/c/Users/shuff57/Documents/GitHub/agent-mem/` (not `~/`)
- Git identity: `shuff57` / `shuff57@users.noreply.github.com`
- Branch: `master` (not `main`)
- graphify does NOT index `.md` files — use `read_file` or `search_files` for queries
- `git pull` before writing to prevent conflicts, especially across devices
- Junction target path with spaces needs PowerShell (not cmd.exe mklink)