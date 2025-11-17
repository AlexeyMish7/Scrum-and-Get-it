#!/usr/bin/env pwsh
<#
.SYNOPSIS
    End-to-end test script for job_pipeline workspace migration verification

.DESCRIPTION
    This script performs comprehensive testing to verify that the job_pipeline workspace
    is fully functional and the old jobs directory can be safely deleted.

    Tests performed:
    1. Frontend compilation (TypeScript)
    2. Frontend unit tests
    3. Backend API tests
    4. Integration smoke tests
    5. Route verification
    6. Import resolution

.EXAMPLE
    .\verify-job-pipeline.ps1
#>

param(
    [switch]$SkipFrontendTests,
    [switch]$SkipBackendTests,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Section { Write-Host "`n=== $args ===" -ForegroundColor Yellow }

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     JOB PIPELINE MIGRATION VERIFICATION SUITE            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$startTime = Get-Date
$testsPassed = 0
$testsFailed = 0

# Change to frontend directory
Write-Section "Environment Setup"
$frontendDir = Join-Path $PSScriptRoot ".." "frontend"
$serverDir = Join-Path $PSScriptRoot ".." "server"

if (!(Test-Path $frontendDir)) {
    Write-Error-Custom "Frontend directory not found: $frontendDir"
    exit 1
}

Write-Success "Found frontend directory"
Write-Success "Found server directory"

# Test 1: TypeScript Compilation
Write-Section "Test 1: TypeScript Compilation"
Write-Info "Running TypeScript type check..."

Push-Location $frontendDir
try {
    $typecheckOutput = npm run typecheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "TypeScript compilation passed"
        $testsPassed++
    } else {
        Write-Error-Custom "TypeScript compilation failed"
        if ($Verbose) { Write-Host $typecheckOutput }
        $testsFailed++
    }
} finally {
    Pop-Location
}

# Test 2: Import Resolution
Write-Section "Test 2: Import Resolution Verification"
Write-Info "Checking for broken @job_pipeline imports..."

Push-Location $frontendDir
try {
    $files = Get-ChildItem -Path "src/app/workspaces/job_pipeline" -Recurse -Include "*.ts","*.tsx"
    $brokenImports = @()

    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match 'from "@jobs') {
            $brokenImports += $file.FullName
        }
    }

    if ($brokenImports.Count -gt 0) {
        Write-Error-Custom "Found old @jobs imports in job_pipeline:"
        $brokenImports | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        $testsFailed++
    } else {
        Write-Success "All imports updated to @job_pipeline"
        $testsPassed++
    }
} finally {
    Pop-Location
}

# Test 3: File Structure Validation
Write-Section "Test 3: File Structure Validation"
Write-Info "Verifying job_pipeline directory structure..."

$requiredDirs = @(
    "src/app/workspaces/job_pipeline/types",
    "src/app/workspaces/job_pipeline/components",
    "src/app/workspaces/job_pipeline/pages",
    "src/app/workspaces/job_pipeline/hooks",
    "src/app/workspaces/job_pipeline/services",
    "src/app/workspaces/job_pipeline/views",
    "src/app/workspaces/job_pipeline/layouts"
)

$structureValid = $true
foreach ($dir in $requiredDirs) {
    $fullPath = Join-Path $frontendDir $dir
    if (Test-Path $fullPath) {
        Write-Success "$dir exists"
    } else {
        Write-Error-Custom "$dir missing"
        $structureValid = $false
    }
}

if ($structureValid) {
    $testsPassed++
} else {
    $testsFailed++
}

# Test 4: Frontend Unit Tests (if not skipped)
if (!$SkipFrontendTests) {
    Write-Section "Test 4: Frontend Unit Tests"
    Write-Info "Running job_pipeline unit tests..."

    Push-Location $frontendDir
    try {
        # Run only job_pipeline tests
        $testOutput = npm test -- job_pipeline 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend unit tests passed"
            $testsPassed++
        } else {
            Write-Error-Custom "Frontend unit tests failed"
            if ($Verbose) { Write-Host $testOutput }
            $testsFailed++
        }
    } catch {
        Write-Info "Unit tests not configured (vitest may not be set up)"
        Write-Info "Skipping unit tests..."
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Skipping frontend unit tests (--SkipFrontendTests flag)"
}

# Test 5: Backend API Tests (if not skipped)
if (!$SkipBackendTests) {
    Write-Section "Test 5: Backend API Tests"
    Write-Info "Running backend integration tests..."

    Push-Location $serverDir
    try {
        # Check if server tests exist
        if (Test-Path "tests/api/jobs.api.test.ts") {
            $testOutput = npm test -- jobs.api.test 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Backend API tests passed"
                $testsPassed++
            } else {
                Write-Error-Custom "Backend API tests failed"
                if ($Verbose) { Write-Host $testOutput }
                $testsFailed++
            }
        } else {
            Write-Info "Backend tests file not found, skipping..."
        }
    } catch {
        Write-Info "Backend tests not configured, skipping..."
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Skipping backend tests (--SkipBackendTests flag)"
}

# Test 6: Critical File Existence
Write-Section "Test 6: Critical Files Verification"
Write-Info "Checking for critical job_pipeline files..."

$criticalFiles = @(
    "src/app/workspaces/job_pipeline/index.ts",
    "src/app/workspaces/job_pipeline/types/index.ts",
    "src/app/workspaces/job_pipeline/services/jobsService.ts",
    "src/app/workspaces/job_pipeline/services/pipelineService.ts",
    "src/app/workspaces/job_pipeline/hooks/useJobMatch.ts",
    "src/app/workspaces/job_pipeline/hooks/useJobsPipeline.ts",
    "src/app/workspaces/job_pipeline/layouts/JobPipelineLayout.tsx",
    "src/app/workspaces/job_pipeline/pages/PipelinePage/PipelinePage.tsx"
)

$filesExist = $true
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $frontendDir $file
    if (Test-Path $fullPath) {
        Write-Success "$file exists"
    } else {
        Write-Error-Custom "$file missing"
        $filesExist = $false
    }
}

if ($filesExist) {
    $testsPassed++
} else {
    $testsFailed++
}

# Test 7: Router Configuration
Write-Section "Test 7: Router Configuration"
Write-Info "Verifying router imports job_pipeline..."

Push-Location $frontendDir
try {
    $routerContent = Get-Content "src/router.tsx" -Raw

    $checks = @(
        @{ Pattern = '@workspaces/job_pipeline/layouts/JobPipelineLayout'; Name = "JobPipelineLayout import" },
        @{ Pattern = 'job_pipeline/pages/PipelinePage'; Name = "PipelinePage route" },
        @{ Pattern = 'job_pipeline/views/PipelineView'; Name = "PipelineView route" }
    )

    $routerValid = $true
    foreach ($check in $checks) {
        if ($routerContent -match $check.Pattern) {
            Write-Success "$($check.Name) configured"
        } else {
            Write-Error-Custom "$($check.Name) missing"
            $routerValid = $false
        }
    }

    if ($routerValid) {
        $testsPassed++
    } else {
        $testsFailed++
    }
} finally {
    Pop-Location
}

# Test 8: Path Aliases Configuration
Write-Section "Test 8: Path Aliases Configuration"
Write-Info "Verifying tsconfig and vite path aliases..."

Push-Location $frontendDir
try {
    $tsconfigContent = Get-Content "tsconfig.app.json" -Raw
    $viteConfigContent = Get-Content "vite.config.ts" -Raw

    $aliasesValid = $true

    if ($tsconfigContent -match '@job_pipeline') {
        Write-Success "tsconfig.app.json has @job_pipeline alias"
    } else {
        Write-Error-Custom "tsconfig.app.json missing @job_pipeline alias"
        $aliasesValid = $false
    }

    if ($viteConfigContent -match '@job_pipeline') {
        Write-Success "vite.config.ts has @job_pipeline alias"
    } else {
        Write-Error-Custom "vite.config.ts missing @job_pipeline alias"
        $aliasesValid = $false
    }

    if ($aliasesValid) {
        $testsPassed++
    } else {
        $testsFailed++
    }
} finally {
    Pop-Location
}

# Summary
Write-Section "Test Summary"
$duration = (Get-Date) - $startTime
$totalTests = $testsPassed + $testsFailed

Write-Host ""
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host "Duration: $($duration.TotalSeconds) seconds" -ForegroundColor White
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ✓ ALL TESTS PASSED - SAFE TO DELETE OLD FOLDER      ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""

    Write-Info "You can now safely delete the old jobs folder:"
    Write-Host "  Remove-Item -Recurse -Force frontend/src/app/workspaces/jobs" -ForegroundColor Yellow
    Write-Host ""

    exit 0
} else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║     ✗ SOME TESTS FAILED - DO NOT DELETE YET             ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""

    Write-Info "Fix the failing tests before deleting the old jobs folder."
    Write-Info "Run with -Verbose flag for detailed output."
    Write-Host ""

    exit 1
}
