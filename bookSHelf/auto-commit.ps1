# Auto-commit bookSHelf memories to agent-evo repo
# Run this after Hermes sessions to sync memories

param(
    [switch]$WhatIf       # Show what would be done without doing it
)

Write-Host "=== bookSHelf Memories Auto-Commit ==="
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Repo: agent-evo"
Write-Host ""

# Navigate to agent-evo root
$agentEvoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $agentEvoRoot

Write-Host "Working directory: $(Get-Location)"
Write-Host ""

# Check for changes in bookSHelf memories
$memoriesPath = "bookSHelf/memories/"
$staged = git diff --cached --name-only $memoriesPath 2>$null
$unstaged = git diff --name-only $memoriesPath 2>$null
$untracked = git ls-files --others --exclude-standard $memoriesPath 2>$null

Write-Host "Checking: $memoriesPath"
Write-Host "Staged changes: $([string]::IsNullOrWhiteSpace($staged) ? 'None' : $staged.Count)"
Write-Host "Unstaged changes: $([string]::IsNullOrWhiteSpace($unstaged) ? 'None' : $unstaged.Count)"
Write-Host "Untracked files: $([string]::IsNullOrWhiteSpace($untracked) ? 'None' : $untracked.Count)"
Write-Host ""

if ([string]::IsNullOrWhiteSpace($staged) -and [string]::IsNullOrWhiteSpace($unstaged) -and [string]::IsNullOrWhiteSpace($untracked)) {
    Write-Host "No changes to commit."
    exit 0
}

if ($WhatIf) {
    Write-Host "=== What Would Be Committed ==="
    if ($staged) { Write-Host "Staged: $staged" }
    if ($unstaged) { Write-Host "Unstaged: $unstaged" }
    if ($untracked) { Write-Host "Untracked: $untracked" }
    exit 0
}

# Stage all memory files
Write-Host "Staging memory files..."
git add "$memoriesPath*.md" 2>$null

# Check if there are staged changes
$finalStaged = git diff --cached --name-only 2>$null

if ([string]::IsNullOrWhiteSpace($finalStaged)) {
    Write-Host "No files staged after filtering."
    exit 0
}

Write-Host "Staged files:"
$finalStaged | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

# Commit
$message = "bookSHelf: Update memories $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $message
Write-Host "Committed: $message"

# Push
$remote = git remote -v 2>$null
if ($remote -match 'origin') {
    Write-Host "Pushing to origin..."
    git push origin HEAD
    Write-Host "Pushed successfully."
} else {
    Write-Host "No remote configured. Run: git remote add origin <url>"
}

Write-Host ""
Write-Host "=== Done ==="
