# Memory Sync

Sync local memory changes to the remote agents repository.

## Steps

1. Check git status in `~/Documents/GitHub/agents/`
2. If there are changes, commit and push them
3. Report what was synced

## Commands (Windows)

```powershell
cd ~/Documents/GitHub/agents
.\memory\sync\sync.ps1 -Message "sync: PROJECT_NAME DATE"
```

## Commands (macOS/Linux)

```bash
cd ~/Documents/GitHub/agents
bash memory/sync/sync.sh "sync: PROJECT_NAME DATE"
```

## What Gets Synced

- `memory/hivemind/memories.jsonl` — Learnings and decisions
- `memory/swarmmail/*.jsonl` — Cross-agent communication logs (if any)

## What Does NOT Get Synced

- Binary files
- `memory/cass/` index files (too large, rebuilt locally)
- Temp files
