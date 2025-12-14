<#
.SYNOPSIS
  Builds a single SQL bundle from all timestamped migration files.

.DESCRIPTION
  UC-130 helper: creates one SQL script you can run in Supabase/Neon SQL editor.

  Why: Free-tier hosted databases often don’t have a migration runner connected.
  This keeps the migration order deterministic and reduces the chance of missing a file.

  IMPORTANT:
  - This is intended for a fresh production database.
  - Migrations are not guaranteed to be idempotent.
  - Do NOT commit generated bundle output.

.PARAMETER MigrationsDir
  Directory containing migration .sql files.

.PARAMETER OutputFile
  If provided, writes the bundle to this file. Otherwise prints to stdout.

.PARAMETER IncludeNonDated
  If set, includes non-timestamped .sql files too (NOT recommended for prod).
#>

param(
  [string]$MigrationsDir = (Join-Path $PSScriptRoot "..\db\migrations"),
  [string]$OutputFile = "",
  [switch]$IncludeNonDated
)

if (-not (Test-Path $MigrationsDir)) {
  throw "Migrations directory not found: $MigrationsDir"
}

# Timestamped migrations are the authoritative ordered set.
$timestamped = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" -File |
  Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_.+\.sql$' } |
  Sort-Object -Property Name

if ($timestamped.Count -eq 0) {
  throw "No timestamped migration files found in: $MigrationsDir"
}

$nonDated = @()
if ($IncludeNonDated) {
  $nonDated = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" -File |
    Where-Object { $_.Name -notmatch '^\d{4}-\d{2}-\d{2}_.+\.sql$' } |
    Sort-Object -Property Name
}

$all = @()
$all += $timestamped
$all += $nonDated

$generatedAt = (Get-Date).ToString("s")

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("-- ============================================================================")
$lines.Add("-- MIGRATION BUNDLE (GENERATED)")
$lines.Add("-- Generated: $generatedAt")
$lines.Add("--")
$lines.Add("-- Usage (Supabase):")
$lines.Add("--   1) Create a NEW project for staging/prod")
$lines.Add("--   2) Open SQL Editor")
$lines.Add("--   3) Paste this entire bundle and run")
$lines.Add("--")
$lines.Add("-- Notes:")
$lines.Add("--   - Intended for a fresh database")
$lines.Add("--   - Not guaranteed idempotent")
$lines.Add("--   - Stop immediately if you see errors; don’t keep running")
$lines.Add("-- ============================================================================")
$lines.Add("")

foreach ($file in $all) {
  $lines.Add("-- >>> BEGIN $($file.Name)")
  $lines.Add("-- Source: $($file.FullName)")
  $lines.Add("")

  $content = Get-Content -Path $file.FullName -Raw
  # Normalize line endings for consistent copy/paste.
  $content = $content -replace "\r\n", "\n"

  foreach ($line in $content.Split("`n")) {
    $lines.Add($line)
  }

  $lines.Add("")
  $lines.Add("-- <<< END $($file.Name)")
  $lines.Add("")
}

$outText = ($lines -join "`n")

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  Write-Output $outText
  exit 0
}

$parent = Split-Path -Parent $OutputFile
if ($parent -and -not (Test-Path $parent)) {
  New-Item -ItemType Directory -Path $parent | Out-Null
}

Set-Content -Path $OutputFile -Value $outText -Encoding UTF8
Write-Host "Wrote migration bundle: $OutputFile" -ForegroundColor Green
