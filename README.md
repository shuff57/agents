# Agents

Unified agent framework — 29 agents, 13 teams, 11 chains, 38 skills, persistent memory. Single source of truth for Claude Code and OpenCode.

## Install

**One-liner** (clone + symlink + verify):
```bash
git clone https://github.com/YOUR_USER/agents.git ~/agents && bash ~/agents/install.sh
```

**Or step by step:**
```bash
git clone https://github.com/YOUR_USER/agents.git ~/agents
cd ~/agents
bash install.sh    # detects tools, symlinks, verifies
bash test.sh       # runs full test suite
```

### What `install.sh` does

1. Detects your platform (Linux, macOS, Windows/MSYS)
2. Checks for Claude Code and/or OpenCode
3. Backs up any existing agents in `~/.claude/agents/` and `~/.config/opencode/superpowers/agents/`
4. Symlinks `roster/` to both tool directories
5. Validates all agents, teams, chains, and symlinks

### Configuration

Override defaults with environment variables:
```bash
AGENTS_DIR=~/my/custom/path bash install.sh
```

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENTS_DIR` | `~/agents` | Where to install/find the repo |
| `AGENTS_REPO_URL` | (GitHub URL) | Git clone URL |

## Structure

```
roster/          # 29 agent definitions + teams + chains (symlinked to tools)
skills/          # 38 reusable skill packages (SKILL.md + references)
memory/          # Persistent memory (hivemind JSONL + swarmmail + CASS)
install.sh       # Full installer with platform detection
test.sh          # Test suite (19 checks)
sync.sh          # Minimal symlink-only script
```

## Roster

29 agents organized into 8 categories. See [roster/README.md](roster/README.md) for the full breakdown.

| Category | Agents |
|----------|--------|
| Exploration & Research | scout, librarian, swarm-researcher |
| Planning & Analysis | planner, plan-draft, swarm-planner, metis |
| Review & Critique | reviewer, critic, red-team |
| Advisory | oracle |
| Implementation | code-engineer, prometheus, swarm-worker, documenter |
| Orchestration | atlas, meta-orchestrator |
| Visual & Browser | visual-analyzer, bowser |
| Domain Experts | 9 experts (extensions, theme, skills, config, ui, prompts, agents, cli, keybindings) + test-ping |

## Teams & Chains

**Teams** group agents for coordinated work. **Chains** are sequential pipelines where each step's output feeds the next.

```bash
# View teams
cat roster/teams.yaml

# View chains
cat roster/agent-chain.yaml
```

## Adding an Agent

1. Create `roster/my-agent.md`:
   ```markdown
   ---
   name: my-agent
   description: What this agent does and when to use it.
   ---

   You are my-agent. Your system prompt goes here.
   ```
2. Add to `roster/teams.yaml` if it belongs to a team
3. Add to `roster/agent-chain.yaml` if it participates in a chain
4. Run `bash test.sh` to verify

No `sync.sh` needed after adding files — the symlink points to the directory, so new files appear instantly.

## Testing

```bash
bash test.sh          # structural + integrity checks (19 tests)
bash test.sh --live   # also invoke test-ping via Claude Code
```

Tests check:
- All agents have valid YAML frontmatter (`name`, `description`)
- All agents have non-empty system prompts
- All team/chain references resolve to agent files
- Symlinks are active and tools can see agents
- No platform-specific text in prompts
- Skills all have SKILL.md
- Memory stores exist

## Memory

Persistent cross-session memory via hivemind (JSONL + embeddings).

```bash
# Sync memory to remote
bash memory/sync/sync.sh "sync: project-name 2026-03-29"
```

## Uninstall

```bash
rm ~/.claude/agents                              # remove Claude Code symlink
rm ~/.config/opencode/superpowers/agents          # remove OpenCode symlink
rm -rf ~/agents                                   # remove repo
```
