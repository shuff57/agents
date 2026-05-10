---
name: obsidian
description: "Read, search, and create notes in the Obsidian vault — as a second brain, project store, and Hermes memory mirror. Covers: vault access (MCP + direct file), note CRUD, graphify integration, and Hermes memory wiring (second brain architecture with auto-mirror plugins, session handoff, and cron sync)."
---

# Obsidian Vault

Vault location: /mnt/c/Users/shuff57/Documents/Obsidian Vault (WSL path)
Windows path: C:\Users\shuff57\Documents\Obsidian Vault

NOTE: npx/mcp-obsidian runs in Windows context -- use Windows path in config.yaml args.
WSL direct file access uses /mnt/c/... path. Always quote paths (contain spaces).

## MCP Setup (WSL2 PITFALL)

mcp-obsidian runs via npx in the WINDOWS context even from WSL2.
Use the Windows-style path in config.yaml args -- NOT the /mnt/c/... WSL path.

config.yaml entry:
```yaml
mcp_servers:
  obsidian:
    command: "npx"
    args: ["-y", "mcp-obsidian", "C:\\Users\\<user>\\Documents\\Obsidian Vault"]
    timeout: 30
    connect_timeout: 30
```

Wrong (will fail with ENOENT -- resolves as C:\mnt\c\...):
    args: ["-y", "mcp-obsidian", "/mnt/c/Users/.../Obsidian Vault"]

Correct:
    args: ["-y", "mcp-obsidian", "C:\\Users\\...\\Obsidian Vault"]

Verify: `npx -y mcp-obsidian "C:\Users\...\Obsidian Vault"` should print
"MCP Obsidian Server running on stdio" with no ENOENT error.

After restarting Hermes, MCP tools available with prefix mcp_obsidian_*.

Common MCP tools:
- mcp_obsidian_read_note      -- read a note by path
- mcp_obsidian_write_note     -- create or overwrite a note
- mcp_obsidian_search_notes   -- full-text search across vault
- mcp_obsidian_list_directory -- list notes in a folder

## Direct File Access (fallback)

```bash
VAULT="/mnt/c/Users/shuff57/Documents/Obsidian Vault"

# Read
cat "$VAULT/Note Name.md"

# List all notes
find "$VAULT" -name "*.md" -type f

# Search by content
grep -rli "keyword" "$VAULT" --include="*.md"

# Create a note
cat > "$VAULT/New Note.md" << 'END'
# Title
Content here.
END

# Append
echo "\nNew content." >> "$VAULT/Existing Note.md"
```

## Wikilinks

Use [[Note Name]] syntax to link related notes. When creating notes, link related concepts.

## Folder Structure (recommended)

```
Obsidian Vault/
  Projects/      -- active project notes
  Research/      -- research, papers, web clips
  Ideas/         -- brainstorms, fleeting notes
  Knowledge/     -- graphify outputs, concept maps
  Daily/         -- daily notes (YYYY-MM-DD.md)
```

## Graphify Integration

Use Obsidian as a second brain for graphify knowledge graph outputs.

When graphify generates GRAPH_REPORT.md or wiki pages, mirror them into Obsidian:

```bash
VAULT="/mnt/c/Users/shuff57/Documents/Obsidian Vault"
PROJECT_DIR="/path/to/project"

# Copy graphify wiki into vault
cp -r "$PROJECT_DIR/graphify-out/wiki/"*.md "$VAULT/Knowledge/graphify-wiki/"

# Copy graph report
cp "$PROJECT_DIR/graphify-out/GRAPH_REPORT.md" "$VAULT/Knowledge/Graph Report.md"
```

When saving graphify insights to Obsidian:
- Use [[wikilinks]] to connect nodes to related notes
- Add YAML frontmatter with tags for graph communities
- Use the Knowledge/ folder for graph-derived notes
- Cross-link with Projects/ notes for context

Example note template for a graphify node:

```markdown
---
tags: [graphify, community-N, project-name]
source: graphify-out/wiki/NodeName.md
---

# NodeName

[[wikilink to related concept]]

## Summary
...

## Connections
- [[Connected Node 1]]
- [[Connected Node 2]]
```

## Tips

- Obsidian must be open for the local REST API plugin (if used) to respond
- Direct file access (grep/cat) works even when Obsidian is closed
- The MCP server (mcp-obsidian) reads vault files directly -- no Obsidian process needed
- Vault syncs to Windows filesystem in real time via WSL2 /mnt/c mount

---

## Hermes Second Brain Architecture (from obsidian-second-brain)

Wire Hermes memory into Obsidian for persistent knowledge across sessions. Three layers:

### Layer 1: Live Mirror (obsidian-memory-mirror plugin)
- Hook: `post_tool_call` — watches for tool_name == 'memory'
- On fire: writes structured markdown to `vault/Hermes/Memory.md` or `vault/Hermes/User Profile.md`
- Location: `~/.hermes/plugins/obsidian-memory-mirror/`

### Layer 2: Session Handoff (obsidian-session-handoff plugin)
- Hooks: `on_session_end`, `pre_llm_call`
- On session end: writes `Daily/YYYY-MM-DD.md` (append) + `Hermes/Sessions/YYYY-MM-DD-<sid>.md` (new)
- On next session: injects hint pointing at latest session note

### Layer 3: Periodic Sync (cron job)
- Full memory sweep every 6 hours
- Creates/updates `vault/Hermes/Memory.md` and `vault/Hermes/User Profile.md`

### Vault Structure for Second Brain
```
<vault>/
  Hermes/
    Memory.md           -- agent notes (live mirror)
    User Profile.md     -- user profile (live mirror)
    Sessions/
      YYYY-MM-DD-<sid>.md  -- per-session handoff notes
  Daily/
    YYYY-MM-DD.md       -- daily log
```

### Pitfalls
- WSL2: npx runs in Windows context — mcp-obsidian needs Windows path; plugin file writes use WSL /mnt/c/ path
- `hooks_registered` field on plugin object can be empty even when hooks work — check `mgr._hooks` instead
- Always wrap hook bodies in try/except — uncaught exceptions silently swallowed
