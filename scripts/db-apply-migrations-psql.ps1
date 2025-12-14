<#
.SYNOPSIS
  Applies all timestamped migration files using psql.

.DESCRIPTION
  UC-130 helper: runs each `db/migrations/YYYY-MM-DD_*.sql` in order.

  Requires:
  - `psql` installed and available on PATH (Postgres client tools)
  - A connection string with sufficient privileges (Supabase/Neon)

.PARAMETER DatabaseUrl
  Postgres connection string.
  Example (Supabase): postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres

.PARAMETER MigrationsDir
  Directory containing migration .sql files.

.PARAMETER DryRun
  Prints which files would run, without applying.
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [string]$MigrationsDir = (Join-Path $PSScriptRoot "..\db\migrations"),
  [switch]$DryRun
)

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw "psql not found on PATH. Install Postgres client tools (psql) or use scripts/db-build-migration-bundle.ps1 with Supabase SQL Editor."
}

if (-not (Test-Path $MigrationsDir)) {
  throw "Migrations directory not found: $MigrationsDir"
}

$migrations = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" -File |
  Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_.+\.sql$' } |
  Sort-Object -Property Name

if ($migrations.Count -eq 0) {
  throw "No timestamped migration files found in: $MigrationsDir"
}

Write-Host "Target DB: (hidden)" -ForegroundColor Cyan
Write-Host "Migrations: $($migrations.Count)" -ForegroundColor Cyan

foreach ($file in $migrations) {
  Write-Host "-> $($file.Name)" -ForegroundColor Gray

  if ($DryRun) {
    continue
  }

  # ON_ERROR_STOP ensures we fail fast on the first error.
  & psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $file.FullName
  if ($LASTEXITCODE -ne 0) {
    throw "Migration failed: $($file.Name) (psql exit code $LASTEXITCODE)"
  }
}

Write-Host "All migrations applied successfully." -ForegroundColor Green
