#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Development startup script for Scrum-and-Get-it
.DESCRIPTION
    Opens two separate terminal windows:
    - One for backend server (npm install + npm run dev)
    - One for frontend (npm install + npm run dev)
#>

Write-Host "Starting Scrum-and-Get-it Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$projectRoot = $PSScriptRoot

# Terminal 1: Backend Server
Write-Host "Launching Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\server'; Write-Host 'Backend Server' -ForegroundColor Yellow; Write-Host 'Installing dependencies...' -ForegroundColor Gray; npm install; Write-Host ''; Write-Host 'Starting dev server...' -ForegroundColor Gray; npm run dev"
)

# Wait a moment before launching second terminal
Start-Sleep -Milliseconds 500

# Terminal 2: Frontend
Write-Host "Launching Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\frontend'; Write-Host 'Frontend' -ForegroundColor Magenta; Write-Host 'Installing dependencies...' -ForegroundColor Gray; npm install; Write-Host ''; Write-Host 'Starting dev server...' -ForegroundColor Gray; npm run dev"
)

Write-Host ""
Write-Host "Development terminals launched!" -ForegroundColor Green
Write-Host "   - Backend: http://localhost:8787" -ForegroundColor Gray
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
