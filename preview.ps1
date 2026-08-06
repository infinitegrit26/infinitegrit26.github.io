# Preview the site locally, exactly as GitHub Pages will build it.
#
#   Right-click this file → "Run with PowerShell"   (or run:  .\preview.ps1)
#   Then open http://localhost:4000 — pages reload as you save changes.
#   Press Ctrl+C in this window to stop.
#
# Needs Docker Desktop running. The first run takes a few minutes to set up;
# after that it starts in seconds.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Desktop isn't running. Start it, wait for it to finish loading, then run this again." -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
}

docker image inspect portfolio-jekyll *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "First run: setting up Jekyll (takes a few minutes, only once)..." -ForegroundColor Cyan
    Get-Content tools/jekyll.Dockerfile -Raw | docker build -t portfolio-jekyll -
    if ($LASTEXITCODE -ne 0) { Read-Host "Setup failed. Press Enter to close"; exit 1 }
}

# Pull in Medium stories too, if Python is installed (optional).
if (Get-Command python -ErrorAction SilentlyContinue) {
    python .github/scripts/import_medium.py
}

Write-Host ""
Write-Host "Starting preview at http://localhost:4000  (Ctrl+C to stop)" -ForegroundColor Green
Start-Process "http://localhost:4000"
docker run --rm -it -p 4000:4000 -p 35729:35729 -v "${PWD}:/site" portfolio-jekyll
