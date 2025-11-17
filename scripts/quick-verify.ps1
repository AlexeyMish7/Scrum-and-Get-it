#!/usr/bin/env pwsh
# Simple verification script for job_pipeline migration

Write-Host "`n=== Job Pipeline Migration Quick Check ===" -ForegroundColor Cyan

$rootDir = $PSScriptRoot
$frontendDir = Join-Path $rootDir ".." "frontend"

# Test 1: TypeScript Compilation
Write-Host "`nTest 1: TypeScript Compilation" -ForegroundColor Yellow
Push-Location $frontendDir
$typecheckResult = npm run typecheck 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript compilation passed" -ForegroundColor Green
} else {
    Write-Host "✗ TypeScript compilation failed" -ForegroundColor Red
    exit 1
}

# Test 2: Check for old imports
Write-Host "`nTest 2: Import Resolution" -ForegroundColor Yellow
$files = Get-ChildItem -Path (Join-Path $frontendDir "src/app/workspaces/job_pipeline") -Recurse -Include "*.ts","*.tsx"
$brokenImports = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'from "@jobs') {
        $brokenImports += $file.Name
    }
}

if ($brokenImports.Count -gt 0) {
    Write-Host "✗ Found old @jobs imports:" -ForegroundColor Red
    $brokenImports | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    exit 1
} else {
    Write-Host "✓ All imports updated to @job_pipeline" -ForegroundColor Green
}

# Test 3: Critical files exist
Write-Host "`nTest 3: Critical Files" -ForegroundColor Yellow
$criticalFiles = @(
    "src/app/workspaces/job_pipeline/index.ts",
    "src/app/workspaces/job_pipeline/types/index.ts",
    "src/app/workspaces/job_pipeline/services/jobsService.ts",
    "src/app/workspaces/job_pipeline/hooks/useJobMatch.ts"
)

$allExist = $true
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $frontendDir $file
    if (!(Test-Path $fullPath)) {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host "✓ All critical files exist" -ForegroundColor Green
} else {
    exit 1
}

# Test 4: Router configuration
Write-Host "`nTest 4: Router Configuration" -ForegroundColor Yellow
$routerPath = Join-Path $frontendDir "src/router.tsx"
$routerContent = Get-Content $routerPath -Raw

if ($routerContent -match '@workspaces/job_pipeline') {
    Write-Host "✓ Router imports job_pipeline" -ForegroundColor Green
} else {
    Write-Host "✗ Router not configured for job_pipeline" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== ✓ ALL CHECKS PASSED ===" -ForegroundColor Green
Write-Host "`nYou can safely delete the old jobs folder:" -ForegroundColor Cyan
Write-Host "  Remove-Item -Recurse -Force frontend/src/app/workspaces/jobs" -ForegroundColor Yellow
Write-Host ""
