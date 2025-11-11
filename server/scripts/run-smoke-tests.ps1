# Smoke Tests Runner for AI Resume Generation API
#
# PURPOSE: Execute end-to-end smoke tests to verify JWT auth and critical API paths.
# USAGE: .\scripts\run-smoke-tests.ps1
#
# This script:
# 1. Validates environment configuration
# 2. Starts server in background if needed
# 3. Runs comprehensive smoke tests
# 4. Reports results and server logs

param(
    [switch]$StartServer = $false,
    [string]$ServerUrl = "http://localhost:8787",
    [switch]$SkipServerCheck = $false,
    [switch]$Verbose = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$ServerDir = Split-Path $PSScriptRoot -Parent
$EnvFile = Join-Path $ServerDir ".env"
$LogFile = Join-Path $ServerDir "tests\smoke-test.log"

Write-Host "🧪 AI Resume Generation - Smoke Tests" -ForegroundColor Cyan
Write-Host "=" * 50

# Function: Check if server is running
function Test-ServerRunning {
    param([string]$Url)

    try {
        $response = Invoke-RestMethod -Uri "$Url/api/health" -Method GET -TimeoutSec 5
        return $response.status -eq "ok"
    }
    catch {
        return $false
    }
}

# Function: Start server in background
function Start-BackgroundServer {
    Write-Host "🚀 Starting server in background..." -ForegroundColor Yellow

    # Change to server directory
    Push-Location $ServerDir

    try {
        # Start server process
        $serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -RedirectStandardOutput "server-output.log" -RedirectStandardError "server-error.log"

        # Wait for server to start
        $timeout = 30
        $elapsed = 0
        do {
            Start-Sleep -Seconds 2
            $elapsed += 2
            $running = Test-ServerRunning -Url $ServerUrl
            if ($running) {
                Write-Host "✅ Server started successfully" -ForegroundColor Green
                return $serverProcess
            }
        } while ($elapsed -lt $timeout)

        Write-Host "❌ Server failed to start within $timeout seconds" -ForegroundColor Red
        $serverProcess.Kill()
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Function: Validate environment
function Test-Environment {
    Write-Host "🔧 Validating environment..." -ForegroundColor Yellow

    # Check .env file exists
    if (-not (Test-Path $EnvFile)) {
        Write-Host "❌ Environment file not found: $EnvFile" -ForegroundColor Red
        Write-Host "   Please create .env file with required variables" -ForegroundColor Red
        exit 1
    }

    # Load and check required variables
    $envVars = Get-Content $EnvFile | Where-Object { $_ -match "^[^#].*=" } | ForEach-Object {
        $parts = $_ -split "=", 2
        @{ Name = $parts[0]; Value = $parts[1] }
    }

    $required = @(
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY"
    )

    $missing = @()
    foreach ($var in $required) {
        $found = $envVars | Where-Object { $_.Name -eq $var -and $_.Value }
        if (-not $found) {
            $missing += $var
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
        exit 1
    }

    Write-Host "✅ Environment validation passed" -ForegroundColor Green
}

# Function: Run smoke tests
function Invoke-SmokeTests {
    Write-Host "🧪 Running smoke tests..." -ForegroundColor Yellow

    # Change to server directory
    Push-Location $ServerDir

    try {
        # Set test environment variables
        $env:TEST_SERVER_URL = $ServerUrl
        $env:NODE_NO_WARNINGS = "1"

        # Run smoke tests
        if ($Verbose) {
            Write-Host "Command: npm run smoke" -ForegroundColor Gray
        }

        $testOutput = & npm run smoke 2>&1
        $testExitCode = $LASTEXITCODE

        # Log output
        $testOutput | Out-File -FilePath $LogFile -Encoding UTF8

        # Display output
        $testOutput | ForEach-Object {
            if ($_ -match "✅") {
                Write-Host $_ -ForegroundColor Green
            }
            elseif ($_ -match "❌") {
                Write-Host $_ -ForegroundColor Red
            }
            elseif ($_ -match "🧪|📊|🔧|🏥|🔐|📄|📋|🔗|🛡️|🧹") {
                Write-Host $_ -ForegroundColor Cyan
            }
            else {
                Write-Host $_
            }
        }

        return $testExitCode
    }
    finally {
        Pop-Location
    }
}

# Main execution
try {
    # Validate environment
    Test-Environment

    # Check if server is running
    $serverProcess = $null
    if (-not $SkipServerCheck) {
        $serverRunning = Test-ServerRunning -Url $ServerUrl

        if (-not $serverRunning) {
            if ($StartServer) {
                $serverProcess = Start-BackgroundServer
            }
            else {
                Write-Host "❌ Server not running at $ServerUrl" -ForegroundColor Red
                Write-Host "   Start server manually or use -StartServer flag" -ForegroundColor Yellow
                exit 1
            }
        }
        else {
            Write-Host "✅ Server is running at $ServerUrl" -ForegroundColor Green
        }
    }

    # Run tests
    $exitCode = Invoke-SmokeTests

    # Report results
    Write-Host "`n" + "=" * 50
    if ($exitCode -eq 0) {
        Write-Host "🎉 All smoke tests passed!" -ForegroundColor Green
        Write-Host "   JWT authentication is working correctly" -ForegroundColor Green
    }
    else {
        Write-Host "💥 Smoke tests failed!" -ForegroundColor Red
        Write-Host "   Check logs: $LogFile" -ForegroundColor Yellow
    }

    # Cleanup
    if ($serverProcess) {
        Write-Host "🛑 Stopping background server..." -ForegroundColor Yellow
        $serverProcess.Kill()
        $serverProcess.WaitForExit(5000)
    }

    exit $exitCode
}
catch {
    Write-Host "💥 Script failed: $($_.Exception.Message)" -ForegroundColor Red

    # Cleanup on error
    if ($serverProcess) {
        $serverProcess.Kill()
    }

    exit 1
}