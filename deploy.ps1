#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Build the Lilypad web app and deploy to GitHub Pages.
.DESCRIPTION
  Builds apps/web via Vite, then force-pushes the dist/ output
  to the gh-pages branch of adaptivelab/lilypad-demo.
#>

$ErrorActionPreference = "Stop"

$REPO_URL   = "https://github.com/adaptivelab/lilypad-demo.git"
$BRANCH     = "gh-pages"
$DIST_DIR   = Join-Path $PSScriptRoot "apps\web\dist"
$TEMP_DIR   = Join-Path ([System.IO.Path]::GetTempPath()) "lilypad-deploy-$(Get-Random)"

Write-Host ""
Write-Host "=== Lilypad Deploy ===" -ForegroundColor Cyan
Write-Host ""

# -- 1. Build ---------------------------------------------------------
Write-Host "[1/3] Building..." -ForegroundColor Yellow
Push-Location $PSScriptRoot
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
} finally {
    Pop-Location
}

if (-not (Test-Path $DIST_DIR)) {
    throw "dist/ not found at $DIST_DIR - build may have failed"
}

Write-Host "[1/3] Build complete" -ForegroundColor Green
Write-Host ""

# -- 2. Prepare deploy repo -------------------------------------------
Write-Host "[2/3] Preparing deploy at $TEMP_DIR..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null
Push-Location $TEMP_DIR
try {
    git init --initial-branch $BRANCH
    git remote add origin $REPO_URL

    # Copy dist contents into the temp repo
    Copy-Item -Path (Join-Path $DIST_DIR "*") -Destination $TEMP_DIR -Recurse -Force

    # Add a .nojekyll file so GitHub serves files starting with _ or .
    New-Item -ItemType File -Path ".nojekyll" -Force | Out-Null

    # -- 3. Commit and push --------------------------------------------
    git add -A
    git commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    if ($LASTEXITCODE -ne 0) { throw "Git commit failed" }

    Write-Host ""
    Write-Host "[3/3] Pushing to $REPO_URL ($BRANCH)..." -ForegroundColor Yellow
    git push --force origin $BRANCH
    if ($LASTEXITCODE -ne 0) { throw "Git push failed" }

    Write-Host ""
    Write-Host "[OK] Deployed!" -ForegroundColor Green
    Write-Host "URL: https://adaptivelab.github.io/lilypad-demo/" -ForegroundColor Cyan
    Write-Host ""
} finally {
    Pop-Location
    # Clean up temp dir
    Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue
}
