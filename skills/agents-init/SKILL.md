---
name: agents-init
description: "Use when starting a new project and you need to scaffold the .agents/ directory structure with memory, learning, skills, CLI references, and routing infrastructure. Triggers: 'scaffold agents', 'initialize project', 'set up agent memory', 'new project agents setup'."
---

# Agents Init

> Scaffolds the complete `.agents/` infrastructure for a new project: memory system (LightRAG + Ollama), session reflections, skill directories, CLI references, commands, and the root `AGENTS.md` and `.agents/routing.md` configuration files. Interactively gathers project identity to generate tailored behavioral rules and routing.

## Prerequisites
- Write access to the project root directory
- Python 3.8+ (for memory scripts)
- Ollama installed locally (for memory indexing — optional at scaffold time)

## When to Use
- Starting a new project from scratch
- Adding agent infrastructure to an existing project that has none
- User says "scaffold agents", "set up agent memory", "initialize project agents"

## When NOT to Use
- Project already has `.agents/` directory — use existing infrastructure
- User only wants to add a single skill — use `skill-creator` instead
- User wants to query existing memory — use `lightrag-memory` skill instead

## Guardrails

> **Must NOT:**
> - Overwrite an existing `.agents/` directory without explicit user confirmation
> - Auto-run `setup.sh` without asking first
> - Hardcode machine-specific absolute paths in any generated file
> - Modify existing source code files
> - Create project-specific skills during scaffolding (that's a separate step)

## Quick Start
1. Run interview (4 questions about the project)
2. Scaffold all directories and files
3. Auto-discover CLI tools from project config files
4. Full PATH scan — present all installed tools for user selection
5. Offer to run memory setup

## Workflow

### Phase 1: Safety Check
- **INPUT:** Current project directory
- **ACTION:** Check if `.agents/` or `AGENTS.md` already exist
- **OUTPUT:** If they exist, warn user and ask for confirmation before proceeding. If not, continue.

### Phase 2: Interview
- **INPUT:** User context
- **ACTION:** Ask these questions (use the `question` tool or conversational prompts):

1. **Project name** — What is this project called? (used in AGENTS.md header and routing.md identity)
2. **One-line description** — What does this project do? (e.g., "A task management CLI for developers")
3. **Primary domain** — What domain does this serve? (e.g., "developer tooling", "education", "e-commerce") — this shapes the philosophy and safety sections
4. **Key safety concerns** — What actions should agents be careful about? (e.g., "never modify production database", "always preview before publishing") — 2-3 items is fine

- **OUTPUT:** Collected project metadata for template interpolation

### Phase 3: Scaffold Directory Structure
- **INPUT:** Confirmed project metadata
- **ACTION:** Create this directory tree:

```
AGENTS.md                          (root — from agents-md-template.md)
.agents/
  routing.md                       (from routing-md-template.md)
  memory/
    README.md                      (from memory-readme.md)
    .gitignore                     (content: "lightrag_workdir/")
    pending/
      .gitkeep                     (empty)
    scripts/
      setup.sh                     (from references/setup.sh)
      index_reflection.py          (from references/index_reflection.py)
      query_memory.py              (from references/query_memory.py)
    lightrag_workdir/              (empty dir, gitignored)
  skills/                          (empty — skills created later via skill-creator)
  cli/
    README.md                      (minimal index, see template below)
  commands/                        (empty — commands created later)
```

- **OUTPUT:** All files created

#### CLI README.md content:
```markdown
# CLI Tool References

Lazy-load only — read the specific file you need, not the whole folder.

Add a `<tool>.md` file for each CLI tool agents may need in this project.
Each file should document: working directory, key commands, and usage notes.
```

### Phase 3.5: CLI Auto-Discovery
- **INPUT:** Scaffolded project directory
- **ACTION:** Scan the project root for configuration files that define runnable commands. For each detected file, extract commands and generate a `.agents/cli/<tool>.md` reference following `references/cli-tool-template.md`.

#### Detection table

| Config file | Tool name | File to generate | What to extract |
|---|---|---|---|
| `package.json` (with `"scripts"`) | npm (or yarn/pnpm if lockfile present) | `npm.md` | Every key in `"scripts"` → command table row |
| `pyproject.toml` | python | `python.md` | `[project.scripts]` entry points, `[tool.*]` sections (pytest, ruff, mypy, etc.) |
| `Cargo.toml` | cargo | `cargo.md` | `[[bin]]` targets, workspace members |
| `Makefile` or `makefile` | make | `make.md` | Targets with optional comment descriptions |
| `justfile` | just | `just.md` | Recipe names with comment descriptions |
| `docker-compose.yml` / `docker-compose.yaml` | docker-compose | `docker-compose.md` | Service names and key commands |
| `Dockerfile` | docker | `docker.md` | Build/run context |
| `Taskfile.yml` | task | `task.md` | Task names and descriptions |

#### Also detect tool-specific config files

These indicate a tool is actively used — generate a CLI reference even if the tool isn't in a scripts section:

| Config file(s) | Tool | Notes |
|---|---|---|
| `tsconfig.json` | tsc | TypeScript compiler |
| `vitest.config.*` or `jest.config.*` | vitest / jest | Test runner |
| `.eslintrc*` or `eslint.config.*` | eslint | Linter |
| `.prettierrc*` or `prettier.config.*` | prettier | Formatter |
| `ruff.toml` or `[tool.ruff]` in pyproject.toml | ruff | Python linter |
| `tailwind.config.*` | tailwindcss | CSS framework |
| `.github/workflows/*.yml` | GitHub Actions | CI/CD (note in README, don't generate a CLI file) |

#### Always generate `python-memory.md`

The memory system is always scaffolded, so always create `.agents/cli/python-memory.md` with:
- Working directory: repo root
- Commands: `setup.sh`, `index_reflection.py`, `query_memory.py` (using the venv python path)
- Prerequisites: Python 3.8+, Ollama, required models
- See `references/cli-tool-template.md` for format

#### Per-file generation procedure

For each detected tool:
1. Read the config file
2. Extract command names, descriptions, and working directories
3. Generate `.agents/cli/<tool>.md` using the template format from `references/cli-tool-template.md`
4. Keep files concise (20–80 lines) — command tables, not prose

#### Update CLI README.md as index

After generating all tool files, rewrite `.agents/cli/README.md` as a lazy-loading index:

```markdown
# CLI Tool References

Lazy-load only — read the specific file you need, not the whole folder.

| File | Tool | When to load |
|------|------|-------------|
| `npm.md` | npm | Frontend build, dependency management |
| `python-memory.md` | python3 | Memory indexing and querying |
...
```

- **OUTPUT:** `.agents/cli/<tool>.md` files for each discovered tool, plus updated README.md index. If no config files found beyond the memory system, only `python-memory.md` is generated.

### Phase 3.7: Full PATH Scan & User Selection

Phase 3.5 only finds tools referenced in project config files. This phase discovers **all** CLI tools installed on the system so the user can select which ones agents should know about.

- **INPUT:** Scaffolded `.agents/cli/` directory (may already have files from Phase 3.5)
- **ACTION:**

#### Step 1: Scan non-system PATH directories

List executables in each non-system directory in `$PATH`. These are the directories that contain user-installed tools (not OS plumbing):

```bash
# Scan these directories (skip /usr/bin, /bin, /sbin which are mostly OS internals):
for dir in /usr/local/bin ~/.local/bin ~/.cargo/bin ~/.opencode/bin ~/.lmstudio/bin /snap/bin \
           ~/.config/Code/User/globalStorage/github.copilot-chat/copilotCli \
           ~/.config/Code/User/globalStorage/github.copilot-chat/debugCommand; do
  [ -d "$dir" ] && echo "=== $dir ===" && ls -1 "$dir" 2>/dev/null | sort
done
```

Also check for notable tools in `/usr/bin` that agents commonly need:
```bash
# Check for specific high-value tools in /usr/bin
for tool in git gh docker docker-compose make bun code google-chrome firefox \
            ssh scp rsync strace flatpak jq yq tmux ffmpeg; do
  which "$tool" 2>/dev/null
done
```

#### Step 2: Filter already-documented tools

Remove any tools that already have a `.agents/cli/<tool>.md` file from Phase 3.5.

#### Step 3: Present to user for selection

Group discovered tools by category and present with the `question` tool (multi-select per category):

| Category | What to include |
|----------|----------------|
| **AI & Agent Tools** | claude, opencode, copilot, lms, playwriter, uipro, etc. |
| **Project-Specific** | Tools matching project domain (e.g., cli-anything-freecad for CAD projects) |
| **Languages & Runtimes** | node, bun, python3, go, rustc, etc. |
| **Code Quality** | basedpyright, biome, eslint, ruff, mypy, etc. |
| **Editors & Media** | code, zed, ffmpeg, etc. |
| **System & Network** | ssh, rsync, strace, docker, etc. |

For each tool, show name + one-line description + install path.

#### Step 4: Generate CLI docs for selected tools

For each selected tool:
1. Run `<tool> --help` (or `<tool> -h`, `<tool> help`) to capture usage
2. Run `<tool> --version` (or `<tool> -V`, `<tool> version`) to get version
3. Generate `.agents/cli/<tool>.md` with:
   - Tool name and version
   - Working directory guidance
   - Key commands extracted from help output
   - Project-relevant notes
4. Follow the format in `references/cli-tool-template.md`

#### Step 5: Update CLI README.md index

Rewrite `.agents/cli/README.md` to include all tools from both Phase 3.5 and Phase 3.7, grouped by category:

```markdown
# CLI Tool References

Lazy-load only — read the specific file you need, not the whole folder.

### Project-Specific
| File | Tool | Version | Purpose |
|------|------|---------|---------|
...

### AI & Agent Tools
| File | Tool | Version | Purpose |
|------|------|---------|---------|
...

### General Purpose
| File | Tool | Version | Purpose |
|------|------|---------|---------|
...
```

- **OUTPUT:** Additional `.agents/cli/<tool>.md` files for user-selected system tools, plus updated README.md index with all tools categorized.

### Phase 4: Generate AGENTS.md
- **INPUT:** Interview answers + `references/agents-md-template.md`
- **ACTION:** Read the template from `references/agents-md-template.md`. Replace all `{{placeholders}}` with interview answers. The template has 7 standard sections:
  1. Agent Identity — filled from project name, description, domain
  2. Operating Philosophy — filled from domain context
  3. CLI Tools — points to `.agents/cli/`
  4. Tool Preferences — standard defaults (Playwriter, dry-run-first, etc.)
  5. Safety Rules — filled from user's safety concerns + standard rules
  6. Learning Protocol — standard (identical across projects)
  7. Forbidden Actions — standard + project-specific from safety concerns
- **OUTPUT:** Tailored `AGENTS.md` at project root

### Phase 5: Generate routing.md
- **INPUT:** Interview answers + `references/routing-md-template.md`
- **ACTION:** Read the template from `references/routing-md-template.md`. Replace `{{placeholders}}` with project identity. Leave skill routing section with starter entries for `session-reflector`, `skill-creator`, and `find-skills` (the universal skills).
- **OUTPUT:** Tailored `.agents/routing.md`

### Phase 6: Memory Setup (Optional)
- **INPUT:** Scaffolded files
- **ACTION:** Ask the user: "Run memory setup now? This will `pip install lightrag-hku` and verify Ollama connectivity. [y/n]"
  - If yes: run `bash .agents/memory/scripts/setup.sh`
  - If no: print "Run `bash .agents/memory/scripts/setup.sh` when ready."
- **OUTPUT:** Memory system bootstrapped (or deferred)

### Phase 7: Summary
- **INPUT:** All completed files
- **ACTION:** Print a summary of what was created:
  - File count and tree
  - CLI tools discovered from config files (Phase 3.5) and PATH scan (Phase 3.7)
  - Next steps: "Create project skills with `skill-creator`", "Add more CLI references to `.agents/cli/`", "Memory is ready — reflections go to `.agents/memory/pending/`"
- **OUTPUT:** User knows what was created and what to do next

## Error Handling

| Problem | Action |
|---------|--------|
| `.agents/` already exists | Warn user, ask to overwrite or abort |
| `AGENTS.md` already exists | Warn user, offer to merge or replace |
| `setup.sh` fails (no pip) | Print: "Install Python 3.8+ and pip, then re-run setup.sh" |
| `setup.sh` fails (no Ollama) | Print: "Install Ollama and run `ollama serve`, then re-run setup.sh" |
| User declines memory setup | Scaffold files anyway — memory works without indexing (pending/ still usable) |
| No config files found in project | Generate only `python-memory.md` — note in summary that CLI references can be added manually |
| Config file exists but has no extractable commands | Skip that tool — don't generate an empty CLI reference |
| `<tool> --help` fails or produces no output | Try `<tool> -h` and `<tool> help`; if all fail, skip version/help extraction and generate a minimal doc with just the tool name and path |
| PATH scan finds hundreds of system tools | Only scan non-system directories by default; check `/usr/bin` for a curated list of high-value tools, not everything |
| User selects no tools from PATH scan | Skip Phase 3.7 entirely — the README.md index still reflects Phase 3.5 results |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Hardcoding absolute paths in generated files | Use relative paths everywhere — `.agents/memory/scripts/` not `/home/user/...` |
| Running setup.sh without asking | Always prompt before running — user may not have Ollama installed yet |
| Generating domain-specific skills during scaffold | Only create the directory structure — skills come later via `skill-creator` |
| Forgetting .gitignore for lightrag_workdir | Always create `.agents/memory/.gitignore` with `lightrag_workdir/` |
| Skipping the safety check for existing .agents/ | Always check first — never blindly overwrite |
| Generating CLI files with no commands extracted | Skip tools with empty scripts sections — only generate when there's useful content |
| Hardcoding venv paths in CLI references | Use relative paths like `.agents/memory/.venv/bin/python3` — never absolute |
| Missing the python-memory.md file | Always generate it — the memory system is always scaffolded |
| Only scanning project config files for CLI tools | Always run the full PATH scan (Phase 3.7) — tools like `gws`, `lms`, `cli-anything-freecad` exist outside project configs |
| Scanning `/usr/bin` exhaustively | Only check a curated list of high-value tools in system dirs — the full listing is thousands of OS internals |

## Reference Files

All templates and scripts are in `references/` within this skill directory:

- `references/setup.sh` — Memory bootstrap script
- `references/index_reflection.py` — LightRAG reflection indexer
- `references/query_memory.py` — LightRAG memory query tool
- `references/memory-readme.md` — Memory system README template
- `references/agents-md-template.md` — AGENTS.md template with {{placeholders}}
- `references/routing-md-template.md` — routing.md template with {{placeholders}}
- `references/cli-tool-template.md` — Standard format for `.agents/cli/<tool>.md` files
