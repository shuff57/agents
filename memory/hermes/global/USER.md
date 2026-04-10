User profile: shuff57
- Uses WSL2 on Windows
- Prefers Python 3.12
- Manages agent configuration via agent-evo repository
- Primary project: bookSHelf (AI textbook enhancement pipeline)
- Agent setup: Project-level Hermes at .hermes/ with config.yaml
- External memory/skills sync: /mnt/c/Users/shuff/Documents/GitHub/agent-evo/bookSHelf/
- Desktop app: bookshelf-app/ (Electron + React + Tailwind)
- Pipeline: 11 steps (Scrape→Match→Merge→Remaster→Number→Solutions→Math-check→YouTube→HTML→Verify→Publish→Commit)
- Tech stack: Python 3.8+, Claude Code CLI, MathJax, GitHub Pages
§
bookSHelf project structure: Uses global skills symlinks for cross-device sync via GitHub. All three agent tool locations point to /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/skills/:
- ~/.claude/skills/ → agent-evo/skills/
- ~/.hermes/skills/ → agent-evo/skills/
- ~/.config/opencode/skills/ → agent-evo/skills/

Project-level .claude/, .config/, and .opencode.json removed as redundant - global symlinks handle skills. Only .hermes/ kept in project for config.yaml and hooks.

Skills source of truth: /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/skills/
§
Default Hermes model: github-copilot/claude-sonnet-4.6 (changed from glm-5.1:cloud). Config at ~/.hermes/config.yaml still has ollama base_url/api_key as fallback.