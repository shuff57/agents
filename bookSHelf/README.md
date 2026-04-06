# bookSHelf Project Memories

This folder contains isolated Hermes memories for the bookSHelf project.

## Files

- `MEMORY.md` - Project facts, conventions, technical quirks
- `USER.md` - User preferences for this project

## Auto-Commit

Run this after each Hermes session to sync memories:

```powershell
# From agent-evo root
.\bookSHelf\auto-commit.ps1
```

Or in WSL:
```bash
cd /mnt/c/Users/shuff/Documents/GitHub/agent-evo
bash bookSHelf/auto-commit.sh
```

## Config Location

The bookSHelf project points to this folder via:
`~/bookSHelf/.hermes/config.yaml`

```yaml
memory:
  path: /mnt/c/Users/shuff/Documents/GitHub/agent-evo/bookSHelf/memories/
```

## Multi-Project Structure

```
agent-evo/
├── bookSHelf/memories/       ← This project
├── other-project/memories/   ← Other projects
└── global/                   ← Shared user prefs (optional)
```

Each project has isolated memories that sync independently.
