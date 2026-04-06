# Project Memory Structure

This project uses **isolated memories** stored in `.hermes/memories/`.

## Files

| File | Purpose | Commit? |
|------|---------|---------|
| `MEMORY.md` | Project-specific facts, conventions, quirks | ✓ Yes |
| `USER.md` | User preferences (this project only) | ✓ Yes |
| `REFERENCES/` | Skill references, templates | ✓ Yes |

## Multi-Project Setup

Each project in `agent-evo` has its own memory folder:

```
agent-evo/
├── bookSHelf/memories/       ← This project
│   ├── MEMORY.md             # bookSHelf facts only
│   └── USER.md               # User prefs (project-scoped)
├── other-project/memories/   ← Other project
│   ├── MEMORY.md             # other-project facts only
│   └── USER.md               # User prefs (project-scoped)
└── global/
    └── USER.md               # Shared across all projects (optional)
```

## Sync Flow

```bash
# When you make changes
git add .hermes/memories/*.md
git commit -m "Update bookSHelf memories"
git push

# On new device
git pull
# Memories are already in place
```

## What Goes Where

### MEMORY.md (Project Facts)
- Project name, location, structure
- Technical conventions (math delimiters, etc.)
- System quirks (WSL2 npm workaround)
- Skills used
- Current status

### USER.md (Preferences)
- Communication style
- Workflow preferences
- Environment details
- Project-specific habits

### What Stays Global (Not Committed)
- `~/.hermes/memories/` - Original global memories
- `.hermes/logs/` - Debug logs
- `.hermes/sessions/` - Session cache

## Migration from Global

If you have existing memories in `~/.hermes/memories/`:

```bash
# 1. Review what's there
cat ~/.hermes/memories/MEMORY.md

# 2. Extract bookSHelf-relevant parts
# (Manual editing)

# 3. Save to project
nano .hermes/memories/MEMORY.md

# 4. Commit
git add .hermes/memories/
git commit -m "Add project memories"
```

## Agent Loading

The agent reads these files on session start via `config.yaml`:

```yaml
memory:
  path: .hermes/memories/
  files:
    - MEMORY.md
    - USER.md
```

This ensures **project isolation** — bookSHelf agent only sees bookSHelf memories.
