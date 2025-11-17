# Simple verification script for job_pipeline migration
Write-Host ""
Write-Host "=== Job Pipeline Migration Quick Check ===" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot
$parentDir = Split-Path $rootDir -Parent
$frontendDir = Join-Path $parentDir "frontend"

# Test 1: TypeScript Compilation
Write-Host "Test 1: TypeScript Compilation" -ForegroundColor Yellow
Push-Location $frontendDir
$typecheckResult = npm run typecheck 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "  PASS - TypeScript compilation passed" -ForegroundColor Green
} else {
    Write-Host "  FAIL - TypeScript compilation failed" -ForegroundColor Red
    exit 1
}

# Test 2: Check for old imports
Write-Host ""
Write-Host "Test 2: Import Resolution" -ForegroundColor Yellow
$files = Get-ChildItem -Path (Join-Path $frontendDir "src/app/workspaces/job_pipeline") -Recurse -Include "*.ts","*.tsx"
$brokenImports = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'from "@jobs') {
        $brokenImports += $file.Name
    }
}

if ($brokenImports.Count -gt 0) {
    Write-Host "  FAIL - Found old @jobs imports:" -ForegroundColor Red
    $brokenImports | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
    exit 1
} else {
    Write-Host "  PASS - All imports updated to @job_pipeline" -ForegroundColor Green
}

# Test 3: Critical files exist
Write-Host ""
Write-Host "Test 3: Critical Files" -ForegroundColor Yellow
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
        Write-Host "  FAIL - Missing: $file" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host "  PASS - All critical files exist" -ForegroundColor Green
} else {
    exit 1
}

# Test 4: Router configuration
Write-Host ""
Write-Host "Test 4: Router Configuration" -ForegroundColor Yellow
$routerPath = Join-Path $frontendDir "src/router.tsx"
$routerContent = Get-Content $routerPath -Raw

if ($routerContent -match 'job_pipeline') {
    Write-Host "  PASS - Router imports job_pipeline" -ForegroundColor Green
} else {
    Write-Host "  FAIL - Router not configured for job_pipeline" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== ALL CHECKS PASSED ===" -ForegroundColor Green
Write-Host ""
Write-Host "You can safely delete the old jobs folder:" -ForegroundColor Cyan
Write-Host "  Remove-Item -Recurse -Force frontend/src/app/workspaces/jobs" -ForegroundColor Yellow
Write-Host ""
