<#
Start the server in mock AI mode.

Usage:
  Open PowerShell and run (from repo root):
    cd server\scripts
    .\start-mock-server.ps1

What this does:
- Ensures `server/.env` exists (copies from .env.example if missing)
- Sets `FAKE_AI=true` in `server/.env` (or adds the line)
- Sets session env var `$env:FAKE_AI = 'true'` for the current PowerShell process
- Runs `npm run dev` in the `server` folder (this will run the TypeScript dev server)

#>

Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location (Join-Path $scriptDir '..')  # change to server/

Write-Host ('Server folder: {0}' -f (Get-Location))

if (-not (Test-Path -Path '.env')) {
    Write-Host 'No .env found - copying .env.example -> .env'
    Copy-Item -Path '.env.example' -Destination '.env' -Force
}

# ensure FAKE_AI=true is present
$envFile = Get-Content -Raw -Path ".env"
if ($envFile -match '^FAKE_AI=') {
    $envFile = $envFile -replace '(?m)^FAKE_AI=.*', 'FAKE_AI=true'
} else {
    $envFile = $envFile.TrimEnd() + [Environment]::NewLine + 'FAKE_AI=true' + [Environment]::NewLine
}

Set-Content -Path ".env" -Value $envFile -NoNewline

# export for this session
$env:FAKE_AI = 'true'
Write-Host 'FAKE_AI=true set for this session and in server/.env'

# Load other vars from server/.env into this PowerShell session so Node sees them
try {
    $lines = Get-Content -Path '.env' | Where-Object { $_ -and -not ($_ -match '^\s*#') }
    foreach ($ln in $lines) {
        $m = $ln -match '^\s*([^=\s]+)=(.*)$'
        if ($m) {
            $k = $Matches[1]
            $v = $Matches[2]
            # strip surrounding quotes
            if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            # set in-session env var
            $env:$k = $v
        }
    }
    Write-Host 'Exported env vars from server/.env into this session.'
} catch {
    Write-Warning "Failed to export .env vars into session: $_"
}

Write-Host 'Starting server in dev mode (npm run dev). Press Ctrl+C to stop.'
npm run dev

Pop-Location
