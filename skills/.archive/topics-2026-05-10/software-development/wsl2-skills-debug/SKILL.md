---
name: wsl2-skills-debug
description: Debug missing skills in Hermes skills_list on WSL2. Use when a skill exists in agent-evo/skills/ but does not appear in skills_list output.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [hermes, wsl2, skills, debugging, symlink]
    category: software-development
---

# WSL2 Skills Debug

## Symptom

Skill exists in `agent-evo/skills/` and `~/.hermes/skills/` symlink is correct, but `skills_list` omits the skill.

## Root Cause: Nested Symlink

The entry inside `agent-evo/skills/<skill-name>` is itself a **symlink-to-dir** (e.g. installed from `~/.agents/skills/` or another location). `os.walk` in Python does NOT follow symlinks by default, so the directory is silently skipped by `iter_skill_index_files`.

## How skills_list Works

- Reads filesystem via `agent/skill_utils.py:iter_skill_index_files`
- Uses `os.walk(skills_dir)` — no followlinks
- Does NOT use `.bundled_manifest` (that's only for bundled skill sync from hermes-agent/skills/)
- Custom skills in agent-evo/skills/ picked up by filesystem scan only

## Diagnosis

```python
import os
from pathlib import Path
skills_dir = Path('/home/shuff57/.hermes/skills')
# Check if skill appears in os.walk
for root, dirs, files in os.walk(skills_dir):
    if '<skill-name>' in root:
        print(root, files)
        break
else:
    print('not found by os.walk')

# Check if it is a symlink
p = skills_dir / '<skill-name>'
print('is_symlink:', p.is_symlink())
print('exists:', p.exists())
```

If `is_symlink: True` and not found by os.walk — that's the bug.

## Fix

Replace the inner symlink with a real directory:

```bash
SKILL=karpathy-guidelines
AGENT_EVO=/mnt/c/Users/shuff57/Documents/GitHub/agent-evo/skills
ORIGINAL=$(readlink "$AGENT_EVO/$SKILL")

rm "$AGENT_EVO/$SKILL"
cp -r "$ORIGINAL" "$AGENT_EVO/$SKILL"
```

Verify os.walk now finds it:

```bash
python3 -c "
import os
from pathlib import Path
for root, dirs, files in os.walk(Path('/home/shuff57/.hermes/skills')):
    if '$SKILL' in root:
        print('found:', root, files)
"
```

## Notes

- `.bundled_manifest` tracks only skills bundled inside `hermes-agent/skills/` — not relevant for custom skills
- `sync_skills()` from `tools/skills_sync.py` only syncs hermes-bundled skills; safe to ignore for agent-evo skills
- This pattern affects any skill installed as a dir-symlink rather than copied directly
