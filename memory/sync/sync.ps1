# agents memory sync script (PowerShell)
# Usage: .\sync\sync.ps1 [-Message "custom message"]

param(
    [string]$Message = "sync: $(Get-Date -Format 'yyyy-MM-dd')"
)

$RepoDir = Split-Path -Parent $PSScriptRoot
Set-Location $RepoDir

Write-Host "→ Pulling latest changes..."
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Pull failed. Check for conflicts."
    exit 1
}

Write-Host "→ Staging changes..."
git add -A

$diff = git diff --cached --quiet 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Nothing to sync — already up to date"
    exit 0
}

Write-Host "→ Committing: $Message"
git commit -m $Message

Write-Host "→ Pushing..."
git push origin main

Write-Host "✓ Sync complete"
