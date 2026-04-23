Scope all chapter-level runs to chapter 1 only before advancing to ch2 — must get explicit go-ahead before starting ch2. Approval gate preference remains even though copilot provider is fast. Also applies to any future chapter boundary (ch2 -> ch3 etc).
§
bookSHelf project structure: Global skills symlinks — all three agent tool locations point to /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/skills/. Only .hermes/ kept in project for config.yaml and hooks.
§
Default Hermes model: ollama/glm-5.1:cloud (changed from copilot/claude-sonnet-4.6). Config at ~/.hermes/config.yaml.
§
bookSHelf remaster standard: full worked solutions are REQUIRED in every Example and Try It Now block -- never truncate or summarize steps. The 3-5 step "conciseness" rule was wrong and has been removed from the prompt.
§
bookSHelf pipeline optimization: self-review for gaps before calling any step done — (1) bad output still written on lint fail, (2) untested, (3) boundary edge cases, (4) progress ordering, (5) output file path. All gaps must be closed + tests passing before moving to next step.