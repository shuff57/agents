---
name: install-github-python-tool
description: >
  Install a Python tool from a GitHub repo on this machine. Use when the user
  says "install X from GitHub" for any Python project. Covers venv creation,
  dependency install, and adding a global launcher.
tags: [python, install, github, venv, uv]
---

# Install Python Tool from GitHub

## Pitfalls on this machine (WSL2/Ubuntu)

- `python3 -m venv` FAILS — python3.12-venv not installed and no sudo
- hermes-agent venv has NO pip module — `venv/bin/python -m pip` errors
- Solution: use `uv venv` + `uv pip install` (uv is at ~/.local/bin/uv)

## Steps

1. Read the repo README via GitHub API (browser often times out):
   ```
   curl -s "https://raw.githubusercontent.com/OWNER/REPO/main/README.md"
   curl -s "https://api.github.com/repos/OWNER/REPO/git/trees/main?recursive=1"
   ```

2. Check for existing install:
   ```
   find ~ -maxdepth 3 -name "*<toolname>*" 2>/dev/null
   pip list 2>/dev/null | grep -i <toolname>
   ```
   If found and user said "uninstall first" — remove the dir and any ~/.local/bin wrapper.

3. Clone:
   ```
   git clone https://github.com/OWNER/REPO.git ~/REPO
   ```

4. Create venv with uv (NOT python3 -m venv):
   ```
   cd ~/REPO
   rm -rf venv   # in case a broken one exists
   uv venv venv --python 3.12
   ```

5. Install:
   ```
   uv pip install -e . --python venv/bin/python
   # or for extras:
   uv pip install -e ".[extras]" --python venv/bin/python
   ```

6. Verify entry point works:
   ```
   ~/REPO/venv/bin/<tool> --help
   ```

7. Optional global wrapper (only if user didn't block it):
   ```
   cat > ~/.local/bin/<tool> << 'EOF'
   #!/usr/bin/env bash
   exec ~/REPO/venv/bin/<tool> "$@"
   EOF
   chmod +x ~/.local/bin/<tool>
   ```

8. For web servers (like hermes-webui): run bootstrap.py with --no-browser,
   then verify with `curl -s http://127.0.0.1:<PORT>/health`.

## bootstrap.py pattern (hermes-webui style)

Some repos ship a bootstrap.py that auto-discovers the agent dir, creates a venv,
starts the server, and waits for /health. Run it as:
```
cd ~/REPO && python3 bootstrap.py --no-browser
```
Uses start_new_session=True so the server persists after bootstrap exits.
Restart: `cd ~/REPO && ./start.sh`

## GitHub API instead of browser

Browser navigation to github.com often times out. Use API instead:
```
# README
curl -s "https://raw.githubusercontent.com/OWNER/REPO/BRANCH/README.md"

# File tree
curl -s "https://api.github.com/repos/OWNER/REPO/git/trees/BRANCH?recursive=1" \
  | python3 -c "import json,sys; t=json.load(sys.stdin); [print(x['path']) for x in t.get('tree',[]) if x['type']!='tree']"

# Repo metadata
curl -s "https://api.github.com/repos/OWNER/REPO"
```
