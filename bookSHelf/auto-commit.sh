#!/bin/bash
# Auto-commit bookSHelf memories to agent-evo repo
# Run this after Hermes sessions to sync memories

echo "=== bookSHelf Memories Auto-Commit ==="
echo "Timestamp: $(date)"
echo "Repo: agent-evo"
echo ""

# Navigate to agent-evo root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AGENT_EVO_ROOT="$( dirname "$SCRIPT_DIR" )"
cd "$AGENT_EVO_ROOT"

echo "Working directory: $(pwd)"
echo ""

# Check for changes in bookSHelf memories
MEMORIES_PATH="bookSHelf/memories/"

echo "Checking: $MEMORIES_PATH"

# Stage all memory files
echo "Staging memory files..."
git add "${MEMORIES_PATH}*.md" 2>/dev/null

# Check if there are staged changes
if git diff --cached --quiet; then
    echo "No files staged after filtering."
    exit 0
fi

echo "Staged files:"
git diff --cached --name-only

# Commit
MESSAGE="bookSHelf: Update memories $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$MESSAGE"
echo "Committed: $MESSAGE"

# Push
if git remote -v 2>/dev/null | grep -q origin; then
    echo "Pushing to origin..."
    git push origin HEAD
    echo "Pushed successfully."
else
    echo "No remote configured. Run: git remote add origin <url>"
fi

echo ""
echo "=== Done ==="
