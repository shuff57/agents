Scope all chapter-level runs to chapter 1 only before advancing to ch2 — must get explicit go-ahead before starting ch2. Approval gate preference remains even though copilot provider is fast. Also applies to any future chapter boundary (ch2 -> ch3 etc).
§
bookSHelf project structure: Global skills symlinks — all three agent tool locations point to /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/skills/. Only .hermes/ kept in project for config.yaml and hooks.
§
Default Hermes model: github-copilot/claude-sonnet-4.6 (changed from glm-5.1:cloud). Config at ~/.hermes/config.yaml still has ollama base_url/api_key as fallback.
§
bookSHelf remaster standard: full worked solutions are REQUIRED in every Example and Try It Now block -- never truncate or summarize steps. The 3-5 step "conciseness" rule was wrong and has been removed from the prompt.
§
bookSHelf pipeline order: fragments -> assemble per section -> remaster per section -> concat into chapter file -> number -> html. NOT remaster fragments first then assemble. Scripts: assemble_chapter.py --mode sections --concat, then remaster, then assemble_chapter.py --from-sections for chapter concat.