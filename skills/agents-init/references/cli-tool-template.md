# CLI Tool Reference Template

Use this format when generating `.agents/cli/<tool>.md` files during auto-discovery.

## Template

```markdown
# <tool-name>

<One-line description: what the tool does in this project.>

## Working directory

`<path>/` or "Any (system-wide CLI)."

## Key commands

| Command | Purpose |
|---------|---------|
| `<command>` | <What it does — action-oriented, concise> |

## Notes

- <Gotchas, integration points, degradation behavior>
- <Agent-relevant features: structured output flags, automation hooks>
```

## Rules

- **20–80 lines per file.** Concise and scannable — not exhaustive docs.
- **Always code-format commands** with backticks in the table.
- **Lead with working directory** before the commands table.
- **Action-oriented descriptions**: "Run tests" not "This is a test runner".
- **Include a Notes section** for gotchas, prerequisites, or integration points.
- **Use relative paths** for working directories — never absolute.
- **Multi-workspace projects**: Add a "Working dir" column to the commands table.

## Multi-workspace variant

For projects with multiple working directories (monorepos):

```markdown
## Key commands

| Command | Working dir | Purpose |
|---------|------------|---------|
| `npm run dev` | `frontend/` | Start dev server |
| `npm run build` | `frontend/` | Production build |
| `cargo test` | `backend/` | Run Rust tests |
```

## Example: package.json auto-discovery

Given this `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest"
  }
}
```

Generate:
```markdown
# npm

Node.js package manager. Runs project scripts defined in package.json.

## Working directory

`.` (project root)

## Key commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (vitest) |

## Notes

- Uses Next.js as the framework.
- `npm start` and `npm test` are standard scripts (no `run` needed).
```

## Example: python-memory.md (always generated)

```markdown
# python3 (LightRAG memory scripts)

Python scripts for agent memory indexing and retrieval.

## Working directory

Run from repo root. Scripts live in `.agents/memory/scripts/`.

## Key commands

| Command | Purpose |
|---------|---------|
| `bash .agents/memory/scripts/setup.sh` | Bootstrap: create venv, install LightRAG, check Ollama |
| `.agents/memory/.venv/bin/python3 .agents/memory/scripts/index_reflection.py <file>` | Index a reflection into the knowledge graph |
| `.agents/memory/.venv/bin/python3 .agents/memory/scripts/query_memory.py "<query>"` | Query memory for past learnings |

## Prerequisites

- Python 3.8+
- `ollama serve` running
- Models: `llama3.2`, `nomic-embed-text`

## Notes

- Scripts degrade gracefully if deps are missing — they print guidance instead of crashing.
- Memory writes always require explicit user confirmation.
- See `.agents/memory/README.md` for the full protocol.
```
