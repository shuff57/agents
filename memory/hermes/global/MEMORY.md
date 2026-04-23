agent-evo: skills/ (88 dirs) symlinked to ~/.hermes/skills/ and ~/.claude/skills/. fact_store ids 1-3 for map+roster.
§
Pipeline: scrape→match→merge→remaster→normalize→number→solutions→math→youtube→html→stitch→verify→publish. AI client fixes: from_args accepts task_type; from_env/create_client no longer default to "openai" (require AI_PROVIDER env/.env); DEFAULT_TIMEOUT=900s; .env has AI_PROVIDER=ollama, AI_MODEL=glm-5.1:cloud, AI_TIMEOUT=1800. html_gen: create-html-body.md + build_template (no --prompt flag). Stitch: stitch_chapter_html.py (no AI). Run sections sequentially (not parallel) to avoid GLM overload. ProjectContext: _find_chapter_dir for Layout B.
§
Hermes config: ~/.hermes/config.yaml. Catalog in fact_store id 4. agent-mem repo LIVE: https://github.com/shuff57/agent-mem — flat md + git. Local: ~/Documents/GitHub/agent-mem/. Structure: memories/global/ + projects/ + sessions/ (gitignored).
§
Prompts: Context Pause + Insight Note = REQUIRED every section. Guided Practice needs Source: tag. Expansion is by design. Full worked solutions mandatory in Examples + Try It Nows (never truncate). Subsection rule-lists: explain + notate only, no invented worked examples.
Ch1 remaster: 89/89 PASS, 0 retries, avg 3.5x expansion, committed a2a8655. Awaiting go-ahead for Ch2.
§
Obsidian MCP fix: use Linux Node.js (~/.local/nodejs/bin/npx) + WSL path. Windows npx via WSL shim caused CancelledError on MCP handshake. Linux npx+v22.14.0 at ~/.local/nodejs/. Config: command=/home/shuff57/.local/nodejs/bin/npx, path=/mnt/c/Users/shuff57/Documents/Obsidian Vault. Graphify integration: mirror graphify-out/wiki/ -> vault/Knowledge/graphify-wiki/.
§
SOUL.md (~/.hermes/SOUL.md): session-startup preloaded skills. Caveman + karpathy-guidelines both inject as [SYSTEM: preloaded] blocks. Add new always-on skills there. Skill missing from skills_list? Check if symlink-to-dir in agent-evo/skills/ — os.walk skips symlinks.
§
OGRE repo: /mnt/c/Users/shuff57/Documents/GitHub/O.G.R.E-OllamaGradingRubricEvaluator/. Run with `bun run dev` (Vite dev server). Tests: `bun run vitest run <file>`. WSL rollup issue — must use bun, not npx vitest.