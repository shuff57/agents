# Agent Memory

Persistent cross-session memory for all AI agents. Synced across machines via git.

## Structure

```
memory/
├── projects/          # Per-project learnings and context
│   └── <project>/
│       └── notes.md   # Freeform markdown notes for this project
├── global/
│   └── notes.md       # Cross-project learnings, preferences, patterns
└── README.md
```

## Usage

Memory lives in `agent-evo/memory/` and is junctioned to `~/.claude/memory/` so Claude Code reads it automatically from any project.

**Reading memory**: Claude reads `.md` files from `~/.claude/memory/` at session start.

**Writing memory**: Ask the agent to save a learning — it will write or append to the appropriate file.

**Syncing**: Commit and push after sessions with notable learnings. Pull on the other machine before starting work.

```bash
# After a session — commit new learnings
cd ~/Documents/GitHub/agent-evo
git add memory/
git commit -m "memory: <project> learnings <date>"
git push

# On the other machine before starting work
git pull
```

## Format

Each notes file is freeform markdown. Suggested structure:

```markdown
# Project Name

## Patterns
- Things that work well

## Gotchas
- Things to avoid or watch for

## Decisions
- Key architectural or design choices and why
```

## Setup on New Device

The junction from `~/.claude/memory/` to this directory is created automatically by `install.sh`.

To verify:
```bash
bash install.sh --verify
```
