# Agent Roster

29 agents, 13 teams, 11 chains. Single source of truth for Claude Code and OpenCode.

## Agent Categories

### Exploration & Research (read-only)
| Agent | Purpose |
|-------|---------|
| **scout** | Fast codebase recon — files, patterns, structure |
| **librarian** | External docs, libraries, GitHub examples, API refs |
| **swarm-researcher** | Pre-swarm context gathering |

### Planning & Analysis (read-only)
| Agent | Purpose |
|-------|---------|
| **planner** | Interview-first structured planning |
| **plan-draft** | Pure plan writer from pre-gathered context |
| **swarm-planner** | CellTree decomposition for parallel execution |
| **metis** | Pre-planning ambiguity/complexity analysis |

### Review & Critique (read-only)
| Agent | Purpose |
|-------|---------|
| **reviewer** | Code review + gap analysis (pre and post implementation) |
| **critic** | Ruthless verification of plans and implementations |
| **red-team** | Security and adversarial testing |

### Advisory (read-only)
| Agent | Purpose |
|-------|---------|
| **oracle** | Complex architecture, hard debugging, security/perf tradeoffs |

### Implementation (read-write)
| Agent | Purpose |
|-------|---------|
| **code-engineer** | Primary coding assistant, default for most work |
| **prometheus** | Autonomous end-to-end implementation |
| **swarm-worker** | Isolated subtask execution in swarm |
| **documenter** | Documentation and README generation |

### Orchestration (read-write)
| Agent | Purpose |
|-------|---------|
| **atlas** | End-to-end project orchestration from plan files |
| **meta-orchestrator** | Coordinates domain experts, builds platform components |

### Visual & Browser
| Agent | Purpose |
|-------|---------|
| **visual-analyzer** | Screenshots, images, PDFs, diagrams |
| **bowser** | Headless Playwright browser automation |

### Domain Experts (read-only, queried by meta-orchestrator)
| Agent | Domain |
|-------|--------|
| **extensions-expert** | Plugins, tools, event handlers |
| **theme-expert** | Color tokens, theme configs |
| **skills-expert** | SKILL.md format, registration |
| **config-expert** | Settings, providers, models |
| **ui-expert** | Components, overlays, widgets |
| **prompts-expert** | Templates, arguments |
| **agents-expert** | Agent .md format, teams, chains |
| **cli-expert** | CLI flags, env vars, scripting |
| **keybindings-expert** | Shortcuts, key combos |

### Utility
| Agent | Purpose |
|-------|---------|
| **test-ping** | Agent loading validation |

## Teams

See [teams.yaml](teams.yaml) for compositions.

## Chains

See [agent-chain.yaml](agent-chain.yaml) for sequential pipelines.

## Setup

```bash
# From the repo root:
bash sync.sh
```

This symlinks `roster/` to both `~/.claude/agents/` and `~/.config/opencode/superpowers/agents/`.
