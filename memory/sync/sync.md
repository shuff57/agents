# Pi Memories — Sync prompt

You are running the pi-memories sync workflow.

## Task

Sync local memory changes to the remote pi-memories repository.

## Steps

1. Check git status in `~/Documents/GitHub/pi-memories/`
2. If there are changes, commit and push them
3. Report what was synced

## Commands (Windows)

```powershell
# Check status
cd ~/Documents/GitHub/pi-memories
git status

# Sync
.\sync\sync.ps1 -Message "sync: PROJECT_NAME DATE"
```

## Commands (macOS/Linux)

```bash
cd ~/Documents/GitHub/pi-memories
bash sync/sync.sh "sync: PROJECT_NAME DATE"
```

## What Gets Synced

- `hivemind/memories.jsonl` — Manual learnings and decisions
- `swarmmail/*.jsonl` — Cross-agent communication logs (if any)

## What Does NOT Get Synced

- Binary files
- `cass/` index files (too large, rebuilt locally)
- Temp files
