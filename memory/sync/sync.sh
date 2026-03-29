#!/usr/bin/env bash
# agents memory sync script — pull latest then push any local changes
# Usage: bash sync/sync.sh [commit-message]

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MSG="${1:-sync: $(date +%Y-%m-%d)}"

cd "$REPO_DIR"

echo "→ Pulling latest changes..."
git pull --rebase origin main 2>&1 || {
  echo "⚠ Pull failed. Check for conflicts."
  exit 1
}

echo "→ Staging changes..."
git add -A

if git diff --cached --quiet; then
  echo "✓ Nothing to sync — already up to date"
  exit 0
fi

echo "→ Committing: $MSG"
git commit -m "$MSG"

echo "→ Pushing..."
git push origin main

echo "✓ Sync complete"
