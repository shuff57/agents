# Agents

Unified agent repository — single source of truth for all coding agent platforms.

## Structure

```
roster/          # Agent definitions, teams, chains (symlinked to tools)
skills/          # Reusable skill packages
memory/          # Persistent memory system
sync.sh          # Symlink setup script
```

## Quick Start

```bash
bash sync.sh
```

This symlinks `roster/` into Claude Code (`~/.claude/agents/`) and OpenCode (`~/.config/opencode/superpowers/agents/`). Edit once, both tools see the change instantly.

## Roster

29 agents organized into categories. See [roster/README.md](roster/README.md) for the full breakdown.

## Adding an Agent

1. Create `roster/my-agent.md` with YAML frontmatter (`name`, `description`) and system prompt
2. Add to `roster/teams.yaml` if it belongs to a team
3. Add to `roster/agent-chain.yaml` if it participates in a chain
4. Run `bash sync.sh` (only needed if symlinks don't exist yet)
