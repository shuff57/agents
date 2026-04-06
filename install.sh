#!/usr/bin/env bash
# agents - install script
# Clones the repo (if needed), symlinks agents to Claude Code and OpenCode,
# and runs a verification pass.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/shuff57/agent-evo/main/install.sh | bash
#   # or after cloning:
#   bash install.sh

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
REPO_URL="${AGENTS_REPO_URL:-https://github.com/shuff57/agent-evo.git}"
INSTALL_DIR="${AGENTS_DIR:-$HOME/Documents/GitHub/agent-evo}"
CLAUDE_DIR="$HOME/.claude"
OPENCODE_DIR="$HOME/.config/opencode/superpowers"
OPENCODE_PLUGINS="$HOME/.config/opencode/plugins"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
fail()  { echo -e "${RED}[fail]${NC}  $*"; }

# ── Platform detection ──────────────────────────────────────────────────────
detect_platform() {
  case "$(uname -s)" in
    Linux*)   PLATFORM="linux" ;;
    Darwin*)  PLATFORM="macos" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
    *)        PLATFORM="unknown" ;;
  esac
  info "Platform: $PLATFORM"
}

# ── Prerequisites ───────────────────────────────────────────────────────────
check_prereqs() {
  info "Checking prerequisites..."

  if ! command -v git &>/dev/null; then
    fail "git is required but not installed"
    exit 1
  fi
  ok "git found"

  # Check for at least one supported tool
  local tools_found=0

  if command -v claude &>/dev/null; then
    ok "Claude Code found: $(claude --version 2>/dev/null | head -1)"
    tools_found=$((tools_found + 1))
  else
    warn "Claude Code not found — skipping Claude Code setup"
  fi

  if command -v opencode &>/dev/null; then
    ok "OpenCode found"
    tools_found=$((tools_found + 1))
  else
    warn "OpenCode not found — skipping OpenCode setup"
  fi

  if [ "$tools_found" -eq 0 ]; then
    fail "Neither Claude Code nor OpenCode found. Install at least one:"
    echo "  Claude Code: https://docs.anthropic.com/en/docs/claude-code"
    echo "  OpenCode:    https://github.com/nicepkg/opencode"
    exit 1
  fi
}

# ── Clone or update repo ───────────────────────────────────────────────────
setup_repo() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Repo exists at $INSTALL_DIR — pulling latest..."
    (cd "$INSTALL_DIR" && git pull --ff-only origin main 2>/dev/null || git pull --ff-only origin master 2>/dev/null) || warn "Pull failed — using existing version"
    ok "Repo updated"
  elif [ -d "$INSTALL_DIR/roster" ]; then
    info "Repo found at $INSTALL_DIR (not a git clone — using as-is)"
    ok "Using existing directory"
  else
    info "Cloning repo to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    ok "Cloned"
  fi
}

# ── Backup and symlink ─────────────────────────────────────────────────────

# Check if a path is a Windows junction (NTFS reparse point).
# -L is unreliable for junctions in Git Bash / MSYS2.
is_junction() {
  local p="$1"
  if [ "$PLATFORM" = "windows" ]; then
    local win_p
    win_p="$(cygpath -w "$p")"
    powershell -Command "(Get-Item -LiteralPath '$win_p' -ErrorAction SilentlyContinue).Attributes -match 'ReparsePoint'" 2>/dev/null | grep -qi 'true'
  else
    [ -L "$p" ]
  fi
}

# Resolve the target of a symlink or junction, normalised to a Unix path.
resolve_link() {
  local p="$1"
  if [ "$PLATFORM" = "windows" ]; then
    local win_p raw
    win_p="$(cygpath -w "$p")"
    raw="$(powershell -Command "(Get-Item -LiteralPath '$win_p').Target" 2>/dev/null)"
    cygpath -u "$raw" 2>/dev/null || echo "$raw"
  else
    readlink "$p" 2>/dev/null || readlink -f "$p" 2>/dev/null
  fi
}

# Remove a symlink or junction without following it into the target.
remove_link() {
  local p="$1"
  if [ "$PLATFORM" = "windows" ]; then
    local win_p
    win_p="$(cygpath -w "$p")"
    # Use PowerShell to remove junction pointer without following target.
    # (Get-Item).Delete() removes the reparse point, not the target contents.
    powershell -Command "(Get-Item -LiteralPath '$win_p').Delete()" 2>/dev/null
  else
    rm "$p"
  fi
}

backup_and_link() {
  local target="$1"
  local source="$2"
  local label="$3"

  # Already correctly linked (symlink or junction)
  if is_junction "$target"; then
    local current
    current="$(resolve_link "$target")"
    # Normalise both to Unix paths for reliable comparison
    local norm_current norm_source
    norm_current="$(cygpath -u "$current" 2>/dev/null || echo "$current")"
    norm_source="$(cygpath -u "$source" 2>/dev/null || echo "$source")"
    if [ "$norm_current" = "$norm_source" ]; then
      ok "$label already linked"
      return
    fi
    info "$label linked elsewhere ($norm_current) — replacing"
    remove_link "$target"
  elif [ -d "$target" ]; then
    # Regular directory — back it up safely
    if [ -d "${target}.bak" ]; then
      warn "${target}.bak already exists — removing old backup"
      rm -rf "${target}.bak"
    fi
    info "Backing up existing $label to ${target}.bak"
    mv "$target" "${target}.bak"
  fi

  mkdir -p "$(dirname "$target")"

  if [ "$PLATFORM" = "windows" ]; then
    local win_target win_source
    win_target="$(cygpath -w "$target")"
    win_source="$(cygpath -w "$source")"
    powershell -Command "New-Item -ItemType Junction -Path '$win_target' -Target '$win_source'" > /dev/null
  else
    ln -sfn "$source" "$target"
  fi
  ok "$label linked -> $source"
}

backup_and_link_file() {
  local target="$1"
  local source="$2"
  local label="$3"

  # Already correctly linked
  if [ -L "$target" ] || is_junction "$target"; then
    local current
    current="$(resolve_link "$target")"
    local norm_current norm_source
    norm_current="$(cygpath -u "$current" 2>/dev/null || echo "$current")"
    norm_source="$(cygpath -u "$source" 2>/dev/null || echo "$source")"
    if [ "$norm_current" = "$norm_source" ]; then
      ok "$label already linked"
      return
    fi
    info "$label linked elsewhere ($norm_current) — replacing"
    rm -f "$target"
  elif [ -f "$target" ]; then
    info "Backing up existing $label to ${target}.bak"
    mv "$target" "${target}.bak"
  fi

  mkdir -p "$(dirname "$target")"

  if [ "$PLATFORM" = "windows" ]; then
    local win_target win_source
    win_target="$(cygpath -w "$target")"
    win_source="$(cygpath -w "$source")"
    cmd //c "mklink \"$win_target\" \"$win_source\"" > /dev/null 2>&1 || ln -sf "$source" "$target"
  else
    ln -sf "$source" "$target"
  fi
  ok "$label linked -> $source"
}

link_all() {
  info "Linking agents, skills, memory, commands, and hooks..."

  if command -v claude &>/dev/null; then
    backup_and_link "$CLAUDE_DIR/agents" "$INSTALL_DIR/roster" "Claude Code agents"
    backup_and_link "$CLAUDE_DIR/skills" "$INSTALL_DIR/skills" "Claude Code skills"
    backup_and_link "$CLAUDE_DIR/memory" "$INSTALL_DIR/memory" "Claude Code memory"

    # Symlink settings.json
    if [ -f "$INSTALL_DIR/settings.json" ]; then
      backup_and_link_file "$CLAUDE_DIR/settings.json" "$INSTALL_DIR/settings.json" "Claude Code settings"
    fi

    # Link custom commands (ultrawork, deep-interview, etc.)
    mkdir -p "$CLAUDE_DIR/commands" "$CLAUDE_DIR/hooks"
    if [ -d "$INSTALL_DIR/commands" ]; then
      for cmd in "$INSTALL_DIR/commands/"*.md; do
        [ -f "$cmd" ] || continue
        local cmd_name
        cmd_name="$(basename "$cmd")"
        cp -f "$cmd" "$CLAUDE_DIR/commands/$cmd_name"
      done
      ok "Claude Code commands synced"
    fi

    # Link custom hooks
    if [ -d "$INSTALL_DIR/hooks" ]; then
      for hook in "$INSTALL_DIR/hooks/"*; do
        [ -f "$hook" ] || continue
        local hook_name
        hook_name="$(basename "$hook")"
        cp -f "$hook" "$CLAUDE_DIR/hooks/$hook_name"
      done
      ok "Claude Code hooks synced"
    fi
  fi

  if command -v opencode &>/dev/null; then
    local OPENCODE_CFG="$HOME/.config/opencode"
    backup_and_link "$OPENCODE_DIR/agents" "$INSTALL_DIR/roster" "OpenCode agents"
    backup_and_link "$OPENCODE_DIR/skills" "$INSTALL_DIR/skills" "OpenCode skills"
    backup_and_link "$OPENCODE_DIR/memory" "$INSTALL_DIR/memory" "OpenCode memory"

    # Symlink opencode config files
    if [ -f "$INSTALL_DIR/opencode.json" ]; then
      backup_and_link_file "$OPENCODE_CFG/opencode.json" "$INSTALL_DIR/opencode.json" "OpenCode config"
    fi
    if [ -f "$INSTALL_DIR/oh-my-openagent.json" ]; then
      backup_and_link_file "$OPENCODE_CFG/oh-my-openagent.json" "$INSTALL_DIR/oh-my-openagent.json" "oh-my-openagent config"
    fi
  fi
}

# ── Evolution Engine ───────────────────────────────────────────────────────
install_evolution() {
  info "Installing evolution engine..."

  # Symlink evolution plugin to OpenCode plugins directory
  if command -v opencode &>/dev/null; then
    backup_and_link "$OPENCODE_PLUGINS/evolution-engine" "$INSTALL_DIR/evolution/plugin" "Evolution engine plugin"
  fi

  # Install Hermes memory backend (source install only — not available on PyPI)
  if command -v uv &>/dev/null; then
    info "Installing Hermes memory backend (NousResearch/hermes-agent)..."
    if git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/hermes-agent 2>/dev/null; then
      (
        cd ~/hermes-agent || exit 1
        uv venv venv --python 3.11 --quiet 2>/dev/null || { warn "Hermes venv creation failed (Python 3.11 required) — memory will use fallback JSONL"; exit 1; }
        VIRTUAL_ENV="$(pwd)/venv" uv pip install -e "." --quiet 2>/dev/null || { warn "Hermes pip install failed — memory will use fallback JSONL"; exit 1; }
        mkdir -p ~/.local/bin
        ln -sf ~/hermes-agent/venv/bin/hermes ~/.local/bin/hermes
        mkdir -p ~/.hermes/{memories,skills,sessions,logs}
        ok "Hermes memory backend installed (~/.local/bin/hermes)"
      ) || true
    else
      warn "Hermes clone failed — memory will use fallback JSONL"
    fi

    # ── Mem0 cross-device memory sync ────────────────────────────────────────
    # mem0ai enables Hermes memories to sync across all devices via Mem0 cloud.
    # Same API key works on every machine — memories are tied to your user_id.
    # Get a free key at: https://app.mem0.ai → Settings → API Keys
    if [ -d ~/hermes-agent/venv ]; then
      info "Installing mem0ai for cross-device memory sync..."
      VIRTUAL_ENV=~/hermes-agent/venv uv pip install mem0ai --quiet 2>/dev/null \
        && ok "mem0ai installed" \
        || warn "mem0ai install failed — Hermes will use local-only memory"

      # Resolve API key: env var takes priority, then prompt interactively
      _mem0_key="${MEM0_API_KEY:-}"
      if [ -z "$_mem0_key" ]; then
        echo ""
        echo -e "${BLUE}[mem0]${NC}  Mem0 syncs Hermes memories across all your devices."
        echo -e "${BLUE}[mem0]${NC}  Get a free key at: https://app.mem0.ai → Settings → API Keys"
        echo -e "${BLUE}[mem0]${NC}  Your existing key works here — no new key needed per device."
        printf "${BLUE}[mem0]${NC}  Enter Mem0 API key (or press Enter to skip): "
        read -r _mem0_key 2>/dev/null || true
      fi

      if [ -n "$_mem0_key" ]; then
        # Write ~/.hermes/mem0.json — credentials + identity
        mkdir -p ~/.hermes
        cat > ~/.hermes/mem0.json <<JSON
{
  "api_key": "$_mem0_key",
  "user_id": "${USER:-hermes-user}",
  "agent_id": "hermes",
  "rerank": true,
  "keyword_search": false
}
JSON
        # Write ~/.hermes/config.yaml — activates mem0 + Ollama as inference provider
        cat > ~/.hermes/config.yaml <<YAML
memory:
  provider: mem0

model:
  default: qwen3-coder-next:cloud
  base_url: http://localhost:11434/v1
  api_key: ollama
YAML
        # Write ~/.hermes/.env — provides OPENAI_API_KEY/BASE_URL so Hermes
        # auto-connects to Ollama without needing shell env vars at runtime
        if [ ! -f ~/.hermes/.env ] || ! grep -q "OPENAI_BASE_URL" ~/.hermes/.env; then
          printf 'OPENAI_API_KEY=ollama\nOPENAI_BASE_URL=http://localhost:11434/v1\n' >> ~/.hermes/.env
          chmod 600 ~/.hermes/.env
        fi
        # Persist key to shell so re-runs can skip the prompt
        if [ -f ~/.bashrc ] && ! grep -q "MEM0_API_KEY" ~/.bashrc; then
          echo "export MEM0_API_KEY=\"$_mem0_key\"" >> ~/.bashrc
        fi
        ok "Mem0 configured — memories will sync across devices (user: ${USER:-hermes-user})"
      else
        warn "Mem0 API key not provided — Hermes will use local-only memory"
        warn "To add later: set MEM0_API_KEY in ~/.bashrc and re-run install.sh"
      fi
    fi
    # ── End Mem0 setup ────────────────────────────────────────────────────────
  else
    warn "uv not found — skipping Hermes install (memory will use fallback JSONL)"
    warn "To install manually: https://github.com/NousResearch/hermes-agent"
  fi

  # Install plugin dependencies
  if [ -f "$INSTALL_DIR/evolution/plugin/package.json" ]; then
    info "Installing plugin dependencies..."
    if command -v bun &>/dev/null; then
      (cd "$INSTALL_DIR/evolution/plugin" && bun install --silent 2>/dev/null) && ok "Plugin deps installed (bun)" || warn "Plugin deps install failed"
    elif command -v npm &>/dev/null; then
      (cd "$INSTALL_DIR/evolution/plugin" && npm install --silent 2>/dev/null) && ok "Plugin deps installed (npm)" || warn "Plugin deps install failed"
    else
      warn "Neither bun nor npm found — plugin deps not installed"
    fi
  fi

  # Create _workspace directories (gitignored, device-local)
  mkdir -p "$INSTALL_DIR/_workspace/_metrics"
  mkdir -p "$INSTALL_DIR/_workspace/_evolution_staged"
  mkdir -p "$INSTALL_DIR/_workspace/_deprecated_skills"
  mkdir -p "$INSTALL_DIR/_workspace/_skill_audit"
  mkdir -p "$INSTALL_DIR/_workspace/_memory"
  ok "Workspace directories created"

  # Create gen-0 factory snapshot if it doesn't exist
  if [ ! -d "$INSTALL_DIR/evolution/backups/gen-0" ]; then
    info "Creating gen-0 factory snapshot..."
    mkdir -p "$INSTALL_DIR/evolution/backups/gen-0"
    cp "$INSTALL_DIR/roster/"*.md "$INSTALL_DIR/evolution/backups/gen-0/" 2>/dev/null
    cp "$INSTALL_DIR/roster/teams.yaml" "$INSTALL_DIR/evolution/backups/gen-0/" 2>/dev/null
    cp "$INSTALL_DIR/roster/agent-chain.yaml" "$INSTALL_DIR/evolution/backups/gen-0/" 2>/dev/null
    ok "Gen-0 factory snapshot created ($(ls "$INSTALL_DIR/evolution/backups/gen-0/" | wc -l) files)"
  else
    ok "Gen-0 factory snapshot already exists"
  fi

  # Ensure .gitignore covers _workspace
  if [ -f "$INSTALL_DIR/.gitignore" ]; then
    if ! grep -q "_workspace" "$INSTALL_DIR/.gitignore"; then
      echo "_workspace/" >> "$INSTALL_DIR/.gitignore"
      echo "evolution/plugin/node_modules/" >> "$INSTALL_DIR/.gitignore"
      ok "Updated .gitignore"
    fi
  fi

  ok "Evolution engine installed"
}
# ── Verify ──────────────────────────────────────────────────────────────────
verify() {
  info "Verifying installation..."
  local errors=0

  # Check roster exists
  if [ ! -f "$INSTALL_DIR/roster/test-ping.md" ]; then
    fail "Roster not found at $INSTALL_DIR/roster/"
    errors=$((errors + 1))
  fi

  # Count agents
  local agent_count
  agent_count=$(ls "$INSTALL_DIR/roster/"*.md 2>/dev/null | grep -cv README || echo 0)
  if [ "$agent_count" -lt 20 ]; then
    fail "Expected 20+ agents, found $agent_count"
    errors=$((errors + 1))
  else
    ok "$agent_count agents in roster"
  fi

  # Check teams and chains
  if [ -f "$INSTALL_DIR/roster/teams.yaml" ]; then
    local team_count
    team_count=$(grep -c '^[a-z]' "$INSTALL_DIR/roster/teams.yaml")
    ok "$team_count teams defined"
  else
    fail "teams.yaml not found"
    errors=$((errors + 1))
  fi

  if [ -f "$INSTALL_DIR/roster/agent-chain.yaml" ]; then
    local chain_count
    chain_count=$(grep -c '^[a-z]' "$INSTALL_DIR/roster/agent-chain.yaml")
    ok "$chain_count chains defined"
  else
    fail "agent-chain.yaml not found"
    errors=$((errors + 1))
  fi

  # Count skills
  local skill_count
  skill_count=$(ls -d "$INSTALL_DIR/skills/"*/ 2>/dev/null | wc -l)
  if [ "$skill_count" -lt 10 ]; then
    fail "Expected 10+ skills, found $skill_count"
    errors=$((errors + 1))
  else
    ok "$skill_count skills in skills/"
  fi

  # Check memory dir
  if [ -d "$INSTALL_DIR/memory/hivemind" ]; then
    ok "Memory directory found"
  else
    fail "Memory directory missing hivemind/"
    errors=$((errors + 1))
  fi

  # Verify symlinks resolve AND point to the correct targets
  verify_link() {
    local link_path="$1" expected_source="$2" label="$3" probe="$4"
    if [ ! -e "$probe" ]; then
      fail "$label link broken (cannot reach $probe)"
      errors=$((errors + 1))
      return
    fi
    if is_junction "$link_path"; then
      local actual
      actual="$(resolve_link "$link_path")"
      local norm_actual norm_expected
      norm_actual="$(cygpath -u "$actual" 2>/dev/null || echo "$actual")"
      norm_expected="$(cygpath -u "$expected_source" 2>/dev/null || echo "$expected_source")"
      if [ "$norm_actual" != "$norm_expected" ]; then
        fail "$label points to $norm_actual (expected $norm_expected)"
        errors=$((errors + 1))
        return
      fi
    fi
    ok "$label OK"
  }

  if command -v claude &>/dev/null; then
    verify_link "$CLAUDE_DIR/agents" "$INSTALL_DIR/roster" "Claude Code agents" "$CLAUDE_DIR/agents/test-ping.md"
    verify_link "$CLAUDE_DIR/skills" "$INSTALL_DIR/skills" "Claude Code skills" "$CLAUDE_DIR/skills/playwriter"
    verify_link "$CLAUDE_DIR/memory" "$INSTALL_DIR/memory" "Claude Code memory" "$CLAUDE_DIR/memory/hivemind"
    verify_link "$CLAUDE_DIR/settings.json" "$INSTALL_DIR/settings.json" "Claude Code settings" "$CLAUDE_DIR/settings.json"
  fi

  if command -v opencode &>/dev/null; then
    local OPENCODE_CFG="$HOME/.config/opencode"
    verify_link "$OPENCODE_DIR/agents" "$INSTALL_DIR/roster" "OpenCode agents" "$OPENCODE_DIR/agents/test-ping.md"
    verify_link "$OPENCODE_DIR/skills" "$INSTALL_DIR/skills" "OpenCode skills" "$OPENCODE_DIR/skills/playwriter"
    verify_link "$OPENCODE_DIR/memory" "$INSTALL_DIR/memory" "OpenCode memory" "$OPENCODE_DIR/memory/hivemind"
    verify_link "$OPENCODE_CFG/opencode.json" "$INSTALL_DIR/opencode.json" "OpenCode config" "$OPENCODE_CFG/opencode.json"
    verify_link "$OPENCODE_CFG/oh-my-openagent.json" "$INSTALL_DIR/oh-my-openagent.json" "oh-my-openagent config" "$OPENCODE_CFG/oh-my-openagent.json"
  fi

  # Validate agent frontmatter
  info "Validating agent frontmatter..."
  local bad_agents=0
  for f in "$INSTALL_DIR/roster/"*.md; do
    [ "$(basename "$f")" = "README.md" ] && continue
    if ! head -1 "$f" | grep -q '^---'; then
      fail "$(basename "$f") — missing frontmatter"
      bad_agents=$((bad_agents + 1))
    fi
    if ! grep -q '^name:' "$f"; then
      fail "$(basename "$f") — missing name field"
      bad_agents=$((bad_agents + 1))
    fi
    if ! grep -q '^description:' "$f"; then
      fail "$(basename "$f") — missing description field"
      bad_agents=$((bad_agents + 1))
    fi
  done
  if [ "$bad_agents" -eq 0 ]; then
    ok "All agents have valid frontmatter"
  fi

  # Check for orphaned team references
  info "Checking team references..."
  local orphans=0
  while IFS= read -r agent_name; do
    agent_name=$(echo "$agent_name" | sed 's/^[[:space:]]*- //' | tr -d '[:space:]')
    [ -z "$agent_name" ] && continue
    [[ "$agent_name" =~ ^# ]] && continue
    [[ "$agent_name" =~ : ]] && continue
    if [ ! -f "$INSTALL_DIR/roster/${agent_name}.md" ]; then
      fail "Team references '$agent_name' but ${agent_name}.md not found"
      orphans=$((orphans + 1))
    fi
  done < <(grep '^\s*-' "$INSTALL_DIR/roster/teams.yaml")
  if [ "$orphans" -eq 0 ]; then
    ok "All team references resolve to agent files"
  fi

  # Verify evolution engine
  info "Checking evolution engine..."
  if [ -f "$INSTALL_DIR/roster/evolver.md" ]; then
    ok "evolver.md found in roster"
  else
    fail "evolver.md missing from roster"
    errors=$((errors + 1))
  fi

  for efile in index.ts observability.ts safety-guard.ts rollback.ts drift-detector.ts hermes-bridge.ts; do
    if [ -f "$INSTALL_DIR/evolution/plugin/$efile" ]; then
      ok "evolution/plugin/$efile found"
    else
      fail "evolution/plugin/$efile missing"
      errors=$((errors + 1))
    fi
  done

  for cfile in safety-checksums.json agent-pins.json model-pricing.json hermes.yaml; do
    if [ -f "$INSTALL_DIR/evolution/config/$cfile" ]; then
      ok "evolution/config/$cfile found"
    else
      fail "evolution/config/$cfile missing"
      errors=$((errors + 1))
    fi
  done

  if [ -d "$INSTALL_DIR/evolution/backups/gen-0" ]; then
    ok "Gen-0 factory snapshot exists"
  else
    fail "Gen-0 factory snapshot missing"
    errors=$((errors + 1))
  fi

  if command -v opencode &>/dev/null; then
    if [ -f "$OPENCODE_PLUGINS/evolution-engine/index.ts" ] 2>/dev/null; then
      ok "Evolution plugin symlink works"
    else
      fail "Evolution plugin symlink broken"
      errors=$((errors + 1))
    fi
  fi

  if grep -q "_workspace" "$INSTALL_DIR/.gitignore" 2>/dev/null; then
    ok "_workspace is gitignored"
  else
    warn "_workspace not in .gitignore"
  fi

  echo ""
  if [ "$errors" -eq 0 ] && [ "$bad_agents" -eq 0 ] && [ "$orphans" -eq 0 ]; then
    echo -e "${GREEN}Installation verified successfully.${NC}"
  else
    echo -e "${RED}Installation has issues — see above.${NC}"
    return 1
  fi
}

# ── Summary ─────────────────────────────────────────────────────────────────
summary() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}Agents framework installed${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "  Roster:  $INSTALL_DIR/roster/"
  echo "  Skills:  $INSTALL_DIR/skills/"
  echo "  Memory:  $INSTALL_DIR/memory/"
  echo ""

  if command -v claude &>/dev/null; then
    echo "  Claude Code:"
    echo "    agents -> $INSTALL_DIR/roster/"
    echo "    skills -> $INSTALL_DIR/skills/"
    echo "    memory -> $INSTALL_DIR/memory/"
    echo "    settings.json -> $INSTALL_DIR/settings.json"
  fi
  if command -v opencode &>/dev/null; then
    echo "  OpenCode:"
    echo "    agents -> $INSTALL_DIR/roster/"
    echo "    skills -> $INSTALL_DIR/skills/"
    echo "    memory -> $INSTALL_DIR/memory/"
    echo "    opencode.json -> $INSTALL_DIR/opencode.json"
  fi
  echo ""
  if [ -d "$INSTALL_DIR/evolution/plugin" ]; then
    echo "  Evolution Engine:"
    echo "    plugin -> ~/.config/opencode/plugins/evolution-engine/"
    echo "    config -> $INSTALL_DIR/evolution/config/"
    echo "    backups -> $INSTALL_DIR/evolution/backups/"
    echo "    tests -> $INSTALL_DIR/evolution/tests/"
    echo ""
  fi
  echo "  Edit agents/skills/memory in the repo — all tools see changes instantly."
  echo "  Evolution engine observes sessions and proposes improvements at session end."
  echo ""

  echo "  Quick test:  claude -p 'use the test-ping agent'"
  echo ""
}

# ── Main ────────────────────────────────────────────────────────────────────
main() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Agents Framework Installer"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  detect_platform
  check_prereqs
  setup_repo
  link_all
  install_evolution
  verify
  summary
}

main "$@"