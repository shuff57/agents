#!/bin/bash
# Sync agent roster to Claude Code
# Run after cloning or when adding/removing agents

REPO="$(cd "$(dirname "$0")" && pwd)/roster"
CLAUDE="$HOME/.claude/agents"

echo "Source: $REPO"
echo ""

# Backup existing Claude Code agents that aren't ours
if [ -d "$CLAUDE" ] && [ ! -L "$CLAUDE" ]; then
  echo "Backing up existing Claude Code agents..."
  mkdir -p "$CLAUDE.bak"
  cp -r "$CLAUDE"/* "$CLAUDE.bak/" 2>/dev/null
  rm -rf "$CLAUDE"
fi

# Create parent dir if needed
mkdir -p "$(dirname "$CLAUDE")"

# Symlink
ln -sfn "$REPO" "$CLAUDE"

echo "Linked: $CLAUDE -> $REPO"
echo ""
echo "Agents: $(ls "$REPO"/*.md 2>/dev/null | wc -l)"
echo "Teams:  $(grep -c '^[a-z]' "$REPO/teams.yaml" 2>/dev/null)"
echo "Chains: $(grep -c '^[a-z]' "$REPO/agent-chain.yaml" 2>/dev/null)"
echo ""
echo "Done."
