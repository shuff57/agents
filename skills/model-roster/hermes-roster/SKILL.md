---
name: hermes-roster
description: Manage agent roster — list agents, show details, check model assignments, verify setup, and dispatch work to the right agent. Covers all 29 agents, 11 teams, and 8 chains.
triggers:
  - roster
  - agents
  - agent roster
  - team
  - chain
  - dispatch
  - which agent
  - assign model
---

# Hermes Agent Roster

Source of truth: /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/roster/
Synced to ~/.claude/agents/ and ~/.config/opencode/superpowers/agents/ via sync.sh.
(Hermes does not use a dedicated agents dir — agents are invoked via Claude Code or OpenCode.)

## Quick Reference — Use the Right Agent

Task                            | Agent            | Model
---                             | ---              | ---
General coding                  | code-engineer    | github-copilot/claude-sonnet-4.6
Autonomous implementation       | prometheus       | github-copilot/claude-sonnet-4.6
End-to-end orchestration        | atlas            | github-copilot/claude-sonnet-4.6
Strategic planning              | planner          | github-copilot/claude-opus-4.6
Architecture / hard debug       | oracle           | github-copilot/claude-opus-4.6
Pre-planning analysis           | metis            | github-copilot/claude-opus-4.6
Evolution / self-improve        | evolver          | github-copilot/claude-sonnet-4.6
Quality verification            | critic           | ollama/glm-5.1:cloud
Security / adversarial          | red-team         | ollama/glm-5:cloud
Test suite authoring            | qa-tester        | ollama/qwen3-coder-next:cloud
Codebase exploration            | scout            | ollama/minimax-m2.7:cloud
External docs / libs            | librarian        | ollama/minimax-m2.7:cloud
Meta-coordination               | meta-orchestrator| ollama/minimax-m2.7:cloud
Debugging / diagnosis           | debugger         | ollama/kimi-k2.5:cloud
UI/UX design                    | designer         | ollama/kimi-k2.5:cloud
Screenshots / PDFs / images     | visual-analyzer  | github-copilot/gemini-3.1-pro-preview
Browser automation              | bowser           | ollama/gemma4:31b-cloud
Documentation                   | documenter       | ollama/gemma4:31b-cloud
Text summarization              | summarizer       | ollama/gemma4:31b-cloud
Agent loading check             | test-ping        | ollama/gemma4:31b-cloud

## Domain Experts (9, all on ollama/gemma4:31b-cloud)

Read-only research agents. Queried in parallel by meta-orchestrator.

  agents-expert       — agent .md frontmatter format, teams.yaml, agent-chain orchestration
  cli-expert          — CLI flags, env vars, subcommands, non-interactive usage
  config-expert       — settings files, provider config, model selection
  extensions-expert   — custom tools, event handlers, commands, shortcuts, state management
  keybindings-expert  — shortcut registration, key IDs, modifier combos, terminal compat
  prompts-expert      — prompt template .md format, positional args, discovery locations
  skills-expert       — SKILL.md format, frontmatter fields, directory structure
  theme-expert        — color token systems, theme JSON, variable systems, hot reload
  ui-expert           — built-in/custom components, overlays, keyboard input, widgets

## Agent Categories

Category               | Agents                                              | Access
---                    | ---                                                 | ---
Exploration/Research   | scout, librarian                                    | Read-only
Planning/Analysis      | planner, metis                                      | Read-only
Review/Critique        | critic, red-team, qa-tester                         | Read-only
Advisory/Debugging     | oracle, debugger                                    | Read-only
Implementation         | code-engineer, prometheus, designer, documenter, summarizer | Read-write
Orchestration          | atlas, meta-orchestrator, evolver                   | Read-write
Visual/Browser         | visual-analyzer, bowser                             | Read-only
Domain Experts         | 9 experts (see above)                               | Read-only
Utility                | test-ping                                           | Read-only

## Teams (parallel groups, @team:<name>)

Team            | Agents                                                      | Use Case
---             | ---                                                         | ---
full            | scout, planner, code-engineer, critic, documenter, red-team | Full lifecycle
info            | scout, documenter, critic                                   | Information gathering
frontend        | planner, code-engineer, bowser                              | Frontend work
experts         | meta-orchestrator + all 9 domain experts                    | Platform development
omo             | oracle, librarian, scout, critic                            | Deep research
advisory        | oracle, metis, critic                                       | Architecture decisions
implementation  | code-engineer, prometheus, atlas                            | Building
planning        | scout, planner, critic                                      | Plan creation
quality         | qa-tester, critic, red-team                                 | Post-implementation
design          | designer, code-engineer, critic                             | Design work
debug           | debugger, scout, oracle                                     | Troubleshooting

## Chains (sequential pipelines, @chain:<name>)

Chain                   | Steps                                          | Use Case
---                     | ---                                            | ---
plan-build              | planner → code-engineer                        | Fast two-step
scout-flow              | scout → scout → scout                          | Triple-scout deep recon
plan-review-plan        | planner → critic → planner                     | Iterative planning
full-review             | scout → planner → code-engineer → critic       | Standard lifecycle
research-plan-build     | librarian → planner → prometheus → critic      | Library-dependent tasks
oracle-then-build       | oracle → prometheus → critic                   | Architecture-guided build
ultrawork               | scout → planner → critic → prometheus → critic | 5-phase autonomous loop
deep-interview-then-build | metis → planner → critic → prometheus → critic | Vague/complex requests

## Model Assignments Summary

Model                                 | Agents
---                                   | ---
github-copilot/claude-sonnet-4.6      | prometheus, code-engineer, atlas, evolver
github-copilot/claude-opus-4.6        | planner, oracle, metis
github-copilot/gemini-3.1-pro-preview | visual-analyzer
ollama/glm-5.1:cloud                  | critic
ollama/glm-5:cloud                    | red-team
ollama/minimax-m2.7:cloud             | meta-orchestrator, scout, librarian
ollama/kimi-k2.5:cloud                | debugger, designer
ollama/qwen3-coder-next:cloud         | qa-tester
ollama/gemma4:31b-cloud               | documenter, summarizer, bowser, test-ping, all 9 experts

## Sync Setup

```bash
cd /mnt/c/Users/shuff57/Documents/GitHub/agent-evo
bash sync.sh
```

Symlinks roster/ -> ~/.claude/agents/ and ~/.config/opencode/superpowers/agents/.
Run after cloning or when adding/removing agents.

## Roster Health Check

1. Verify symlinks:
   ls -la ~/.claude/agents             # should point to roster/
   ls -la ~/.config/opencode/superpowers/agents  # should point to roster/

2. Count agents:
   ls ~/.claude/agents/*.md | wc -l    # should be 30 (29 agents + README.md)

3. Ping test: invoke test-ping agent — expect "pong" response

## Deeper Reference

For full details on using teams and chains, load the dedicated skills:
  hermes-team   — all 11 teams, when to use each, invocation, pitfalls
  hermes-chain  — all 8 chains, when to use each, $INPUT/$ORIGINAL vars, pitfalls
  hermes-model-switch — switching providers and models persistently or per-session

## Model Switching

To switch the default model or provider for Hermes, load the hermes-model-switch skill.
Quick reference:
  hermes model                              # interactive picker
  hermes chat -m openrouter/gpt-4o          # per-session
  hermes config set model.provider copilot  # persistent
  hermes config set model.default claude-sonnet-4.6

## Pitfalls

- Agent .md files use YAML frontmatter (name, description, model). Don't edit frontmatter format.
- evolver has tier: 3 and pinned: true — never modify it during evolution runs.
- Teams run agents in parallel; chains run sequentially. Pick the right one.
- meta-orchestrator is the ONLY agent that should query domain experts directly.
- oracle and critic are read-only — they never write files.
- red-team is read-only — reports findings only, no file modifications.
- sync.sh overwrites symlinks, not source roster files in agent-evo/roster/.
- The "full" team includes red-team (6 members total, not 5).
- Hermes has no dedicated agents dir — use Claude Code or OpenCode to invoke agents.
