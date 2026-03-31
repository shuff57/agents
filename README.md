# Agents

Unified agent framework — 47 agents (30 core + 17 GSD), 13 teams, 10 chains, 54 skills, persistent memory. Single source of truth for Claude Code and OpenCode.

## Install

**One-liner** (clone + symlink + verify):
```bash
git clone https://github.com/shuff57/agents.git ~/Documents/GitHub/agents && bash ~/Documents/GitHub/agents/install.sh
```

**Or step by step:**
```bash
git clone https://github.com/shuff57/agents.git ~/Documents/GitHub/agents
cd ~/Documents/GitHub/agents
bash install.sh    # detects tools, symlinks, sets up peers + GSD, verifies
bash test.sh       # runs full test suite
```

### What `install.sh` does

1. Detects your platform (Linux, macOS, Windows/MSYS)
2. Checks for Claude Code and/or OpenCode
3. Backs up any existing agents in `~/.claude/agents/` and `~/.config/opencode/superpowers/agents/`
4. Symlinks `roster/`, `skills/`, and `memory/` to both tool directories
5. Sets up **claude-peers-mcp** (peer discovery + messaging between Claude instances)
6. Installs **GSD** (Get Shit Done — spec-driven development framework)
7. Validates all agents, teams, chains, and symlinks

### Configuration

Override defaults with environment variables:
```bash
AGENTS_DIR=~/my/custom/path bash install.sh
```

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENTS_DIR` | `~/Documents/GitHub/agents` | Where to install/find the repo |
| `AGENTS_REPO_URL` | (GitHub URL) | Git clone URL |

## Structure

```
roster/          # 47 agent definitions + teams + chains (symlinked to tools)
skills/          # 54 reusable skill packages (SKILL.md + references)
memory/          # Persistent memory (hivemind JSONL + swarmmail + CASS)
install.sh       # Full installer with platform detection
test.sh          # Test suite (19 checks)
sync.sh          # Minimal symlink-only script
```

## Roster

47 agents organized into 8 categories plus GSD. See [roster/README.md](roster/README.md) for the full breakdown.

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
| GSD | 17 agents (executor, planner, verifier, debugger, ui-auditor, codebase-mapper, etc.) |

## Teams & Chains

**Teams** group agents for coordinated work. **Chains** are sequential pipelines where each step's output feeds the next.

```bash
# View teams
cat roster/teams.yaml

# View chains
cat roster/agent-chain.yaml
```

## Claude Peers

Multi-instance peer discovery and messaging via MCP. Requires [Bun](https://bun.sh).

- Installed at `~/claude-peers-mcp/` by `install.sh`
- Registered as a user-scope MCP server for Claude Code
- Launch with channels: `claude --dangerously-load-development-channels server:claude-peers`

## GSD (Get Shit Done)

Meta-prompting and spec-driven development framework. Installed globally by `install.sh` via `npx get-shit-done-cc`.

- Start a project: `/gsd:new-project`
- Quick task: `/gsd:quick`
- See all commands: `/gsd:help`

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
rm ~/.claude/skills                              # remove Claude Code skills symlink
rm ~/.claude/memory                              # remove Claude Code memory symlink
rm ~/.config/opencode/superpowers/agents          # remove OpenCode symlink
rm -rf ~/Documents/GitHub/agents                  # remove repo
```
