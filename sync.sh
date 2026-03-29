#!/bin/bash
# Sync agent roster to Claude Code and OpenCode
# Run after cloning or when adding/removing agents

REPO="$(cd "$(dirname "$0")" && pwd)/roster"
CLAUDE="$HOME/.claude/agents"
OPENCODE="$HOME/.config/opencode/superpowers/agents"

echo "Source: $REPO"
echo ""

# Backup existing Claude Code agents that aren't ours
if [ -d "$CLAUDE" ] && [ ! -L "$CLAUDE" ]; then
  echo "Backing up existing Claude Code agents..."
  mkdir -p "$CLAUDE.bak"
  cp -r "$CLAUDE"/* "$CLAUDE.bak/" 2>/dev/null
  rm -rf "$CLAUDE"
fi

# Backup existing OpenCode agents that aren't ours
if [ -d "$OPENCODE" ] && [ ! -L "$OPENCODE" ]; then
  echo "Backing up existing OpenCode agents..."
  mkdir -p "$OPENCODE.bak"
  cp -r "$OPENCODE"/* "$OPENCODE.bak/" 2>/dev/null
  rm -rf "$OPENCODE"
fi

# Create parent dirs if needed
mkdir -p "$(dirname "$CLAUDE")"
mkdir -p "$(dirname "$OPENCODE")"

# Symlink
ln -sfn "$REPO" "$CLAUDE"
ln -sfn "$REPO" "$OPENCODE"

echo "Linked: $CLAUDE -> $REPO"
echo "Linked: $OPENCODE -> $REPO"
echo ""
echo "Agents: $(ls "$REPO"/*.md 2>/dev/null | wc -l)"
echo "Teams:  $(grep -c '^[a-z]' "$REPO/teams.yaml" 2>/dev/null)"
echo "Chains: $(grep -c '^[a-z]' "$REPO/agent-chain.yaml" 2>/dev/null)"
echo ""
echo "Done. Both tools now share the same agent roster."
