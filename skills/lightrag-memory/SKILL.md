---
name: lightrag-memory
description: Use when setting up persistent agent memory in a new project, querying past session learnings, or indexing session reflections into the knowledge graph.
---

# LightRAG Memory Setup

> This skill sets up a LightRAG-powered knowledge graph for persistent agent memory in any project. It creates the .agents/memory/ directory structure with Python scripts for indexing session reflections and querying past learnings.

## Prerequisites
- Python 3.8+ (for creating venv)
- Ollama running locally with `bge-m3` embedding model
- LLM model: cloud model via Ollama (e.g. `nemotron-3-super:cloud`) or local model (e.g. `llama3.2`)
- Git repository (for tracked memory directory)

## When to Use
- Setting up a new project that should have persistent agent memory
- Querying past session learnings before starting significant work
- Indexing session reflections into the knowledge graph

## When NOT to Use
- When the .agents/memory/ structure already exists in the project
- When Ollama is not available (flat-file pending/ will still work)

## Guardrails

> ⚠️ **Must NOT:**
> - Commit lightrag_workdir/ contents to git (auto-generated data)
> - Require LightRAG to be installed for basic memory functionality to work
> - Hardcode project-specific paths in this skill

## Quick Start
1. Create .agents/memory/ structure in your project
2. Run `.agents/memory/scripts/setup.sh` to install LightRAG
3. Use session-reflector skill to write reflections to pending/
4. Run `index_reflection.py` to index reflections into the knowledge graph

## Workflow

### Phase 1: Setup
- **INPUT**: New project without memory infrastructure
- **ACTION**: Create directory structure with .gitkeep and .gitignore; create setup.sh, index_reflection.py, query_memory.py
- **OUTPUT**: .agents/memory/ ready for use

Required structure:
```
.agents/memory/
├── README.md
├── .gitignore          # Contains: lightrag_workdir/ and .venv/
├── .venv/              # Python venv with lightrag-hku — created by setup.sh, gitignored
├── pending/
│   ├── .gitkeep
│   └── indexed/        # Successfully indexed reflections moved here
├── lightrag_workdir/   # Auto-generated — gitignored
└── scripts/
    ├── setup.sh        # Creates venv, installs lightrag-hku, verifies Ollama
    ├── index_reflection.py
    └── query_memory.py
```

### Phase 2: Daily Use
- **At session start**: Check pending/ for unindexed reflections; run `query_memory.py` for relevant past learnings
- **At session end**: Use session-reflector skill to write new reflection to pending/

### Phase 3: Index Reflections
- **INPUT**: Reflection markdown files in pending/
- **ACTION**: Run `.agents/memory/.venv/bin/python3 .agents/memory/scripts/index_reflection.py <file>`; move to `pending/indexed/`
- **OUTPUT**: Knowledge graph updated with new learnings

**Important**: Always use the venv Python (`.agents/memory/.venv/bin/python3`), not system `python3`. The `lightrag-hku` package is installed in the venv only.

## Error Handling

| Problem | Action |
|---------|--------|
| Ollama not running | Reflections still save to pending/ as flat markdown; index later |
| LightRAG not installed / venv missing | Run `bash .agents/memory/scripts/setup.sh` — creates venv and installs deps |
| lightrag_workdir/ committed | Add to .gitignore; remove from tracking: `git rm -r --cached lightrag_workdir/` |

## Script Consistency (CRITICAL)

Both `index_reflection.py` and `query_memory.py` MUST be identical in:
- Embedding model and dimensions (`bge-m3:latest`, 1024-dim)
- `activate_venv()` function for auto-venv activation
- `await rag.initialize_storages()` before any operation (required since lightrag-hku >= 1.4.10)
- LLM model name, host, and timeout kwargs

Mismatched embedding models between scripts means queries will never match indexed content.

## Cloud Models via Ollama

Cloud models (e.g. `nemotron-3-super:cloud`) work through the local Ollama proxy:
- Pull the cloud tag: `ollama pull nemotron-3-super:cloud` (downloads ~345 byte manifest only)
- **Keep `host: "http://localhost:11434"` in both scripts** — local Ollama handles cloud auth
- **Never remove the host kwarg** — LightRAG will bypass local Ollama and hit ollama.com directly (401)
- Cloud models are fast and avoid local iGPU timeout issues

## Timeout Architecture

Two independent timeouts must be configured:

| Parameter | Where | Controls | Default | Recommended |
|-----------|-------|----------|---------|-------------|
| `default_llm_timeout` | LightRAG constructor | Internal worker timeout (2x value) | 180s (360s worker) | 600s |
| `timeout` in `llm_model_kwargs` | Ollama AsyncClient | HTTP read timeout | varies | 600s (cloud) / 1800s (local iGPU) |

## Chunking Behavior

- LightRAG splits docs into ~1200-token chunks, processes in parallel (4 workers)
- Ollama on single GPU (Parallel: 1) processes requests sequentially
- httpx timeout starts from request send, not processing start — queued chunks can timeout
- **For slow local hardware**: index small files (1 chunk each) to avoid parallel queueing
- **For cloud models**: not an issue — cloud handles parallelism

## 4-Field Relation Patch

Many LLMs output relations with 4 fields instead of expected 5 (missing weight). LightRAG `operate.py` line 472 silently drops these. Patch: detect 4-field relations, auto-expand by duplicating field[3] as description. This is applied in the venv's `operate.py` and must be re-applied after `pip install --upgrade lightrag-hku`.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Committing lightrag_workdir/ or .venv/ | .gitignore must contain both `lightrag_workdir/` and `.venv/` |
| Using system python3 instead of venv | Always use `.agents/memory/.venv/bin/python3` — system python won't have lightrag-hku |
| Mismatched embedding model between scripts | Both scripts MUST use `bge-m3:latest` with `embedding_dim=1024` |
| Removing host kwarg for cloud models | Keep `host: "http://localhost:11434"` — local Ollama proxies cloud requests |
| Using default_llm_timeout=180 on slow hardware | Set to 600+ — default causes 360s worker timeout |
| Forgetting `await rag.initialize_storages()` | Required in lightrag-hku >= 1.4.10 before `ainsert` or `aquery` |
| Forgetting to query at session start | Add to AGENTS.md: check .agents/memory/pending/ at session start |
| Upgrading lightrag-hku without re-patching | Re-apply 4-field relation patch in operate.py after upgrades |
