# Pi Memories

Cross-device memory sync for pi coding agent sessions.

## Structure

```
pi-memories/
├── hivemind/
│   └── memories.jsonl     # Manual learnings — one JSON per line
├── cass/
│   └── .gitkeep           # Session index (rebuilt locally, not synced)
├── swarmmail/
│   └── .gitkeep           # Cross-agent messages
└── sync/
    ├── sync.sh            # macOS/Linux sync script
    ├── sync.ps1           # Windows sync script
    └── sync.md            # Sync prompt for pi agents
```

## Quick Sync

**Windows:**
```powershell
cd ~/Documents/GitHub/pi-memories
.\sync\sync.ps1
```

**macOS/Linux:**
```bash
cd ~/Documents/GitHub/pi-memories
bash sync/sync.sh
```

## Memory Format

Each line in `hivemind/memories.jsonl` is a JSON object:
```json
{"id": "1234567890", "information": "Learning text with WHY it matters", "tags": "tag1,tag2", "session_date": "2026-03-22", "project": "project-name"}
```

## Setup on New Device

```bash
git clone git@github.com:shuff/pi-memories.git ~/Documents/GitHub/pi-memories
```
