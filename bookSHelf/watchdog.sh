#!/bin/bash
# Watchdog: Auto-commit bookSHelf memories when they change
# Run this in background while working with Hermes

echo "=== bookSHelf Memories Watchdog ==="
echo "Watching: /mnt/c/Users/shuff/Documents/GitHub/agent-evo/bookSHelf/memories/"
echo "Press Ctrl+C to stop"
echo ""

cd /mnt/c/Users/shuff/Documents/GitHub/agent-evo

while true; do
    # Check for changes
    if ! git diff --quiet bookSHelf/memories/ 2>/dev/null; then
        echo "[$(date '+%H:%M:%S')] Changes detected in memories"
        
        # Stage and commit
        git add bookSHelf/memories/*.md
        git commit -m "bookSHelf: Auto-update memories $(date '+%Y-%m-%d %H:%M:%S')"
        
        # Push
        git push origin HEAD 2>/dev/null && echo "[$(date '+%H:%M:%S')] Pushed to origin" || echo "[$(date '+%H:%M:%S')] Push failed (no auth?)"
        
        echo "[$(date '+%H:%M:%S')] Waiting for next change..."
        echo ""
    fi
    
    sleep 60
done
