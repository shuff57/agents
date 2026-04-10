# Agent Roster

29 agents, 11 teams, 8 chains. Single source of truth for Claude Code and OpenCode.

## Agent Categories

### Exploration & Research (read-only)
| Agent | Purpose |
|-------|---------|
| **scout** | Fast codebase recon — files, patterns, structure |
| **librarian** | External docs, libraries, GitHub examples, API refs |

### Planning & Analysis (read-only)
| Agent | Purpose |
|-------|---------|
| **planner** | Interview-first structured planning |
| **metis** | Pre-planning ambiguity/complexity analysis |

### Review & Critique (read-only)
| Agent | Purpose |
|-------|---------|
| **critic** | Ruthless verification of plans and implementations; gap analysis |
| **red-team** | Security and adversarial testing |
| **qa-tester** | Test suite authoring and edge-case discovery |

### Advisory & Debugging (read-only)
| Agent | Purpose |
|-------|---------|
| **oracle** | Complex architecture, hard debugging, security/perf tradeoffs |
| **debugger** | Systematic root-cause diagnosis via scientific method |

### Implementation (read-write)
| Agent | Purpose |
|-------|---------|
| **code-engineer** | Primary coding assistant, default for most work |
| **prometheus** | Autonomous end-to-end implementation |
| **designer** | UI/UX design and implementation |
| **documenter** | Documentation and README generation |
| **summarizer** | Text summarization and key-point extraction |

### Orchestration (read-write)
| Agent | Purpose |
|-------|---------|
| **atlas** | End-to-end project orchestration from plan files |
| **meta-orchestrator** | Coordinates domain experts, builds platform components |
| **evolver** | Session-end evolution pass — proposes surgical edits |

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

## Model Assignments

| Model | Agents | Role |
|-------|--------|------|
| `github-copilot/claude-sonnet-4.6` | prometheus, code-engineer, atlas, evolver | Heavy implementation & quality |
| `github-copilot/claude-opus-4.6` | planner, oracle, metis | Deep reasoning & planning |
| `github-copilot/gemini-3.1-pro-preview` | visual-analyzer | Vision specialist |
| `ollama/glm-5.1:cloud` | critic | #2 intelligence — detailed review |
| `ollama/glm-5:cloud` | red-team | Elite security testing |
| `ollama/minimax-m2.7:cloud` | meta-orchestrator, scout, librarian | Fast, strong, cheap — coordination & research |
| `ollama/kimi-k2.5:cloud` | debugger, designer | Structured analysis & creative |
| `ollama/qwen3-coder-next:cloud` | qa-tester | Code-focused testing |
| `ollama/gemma4:31b-cloud` | documenter, bowser, test-ping, summarizer, all 9 experts | Lightweight read-only tasks |

## Setup

```bash
# From the repo root:
bash sync.sh
```

This symlinks `roster/` to both `~/.claude/agents/` and `~/.config/opencode/superpowers/agents/`.
