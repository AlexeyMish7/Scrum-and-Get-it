param(
  [Parameter(Mandatory = $false)]
  [string]$SupabaseUrl = $env:SUPABASE_URL,

  [Parameter(Mandatory = $false)]
  [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,

  [Parameter(Mandatory = $false)]
  [string]$AnonKey = $env:SUPABASE_ANON_KEY,

  [Parameter(Mandatory = $false)]
  [string]$EnvFilePath,

  [Parameter(Mandatory = $false)]
  [string[]]$RequiredTables = @(
    "profiles",
    "teams",
    "team_members",
    "jobs",
    "documents",
    "document_versions",
    "document_jobs",
    "generation_sessions",
    "analytics_cache",
    "templates",
    "themes"
  ),

  [Parameter(Mandatory = $false)]
  [int]$MinSystemResumeTemplates = 3,

  [Parameter(Mandatory = $false)]
  [int]$MinSystemCoverLetterTemplates = 1,

  [Parameter(Mandatory = $false)]
  [int]$MinSystemThemes = 8
)

$ErrorActionPreference = "Stop"

function Write-Result([string]$label, [bool]$ok, [string]$details = "") {
  $status = if ($ok) { "OK" } else { "FAIL" }
  if ([string]::IsNullOrWhiteSpace($details)) {
    Write-Host ("[{0}] {1}" -f $status, $label)
  } else {
    Write-Host ("[{0}] {1} - {2}" -f $status, $label, $details)
  }
}

function Read-DotenvFile([string]$path) {
  $map = @{}

  if ([string]::IsNullOrWhiteSpace($path)) {
    return $map
  }

  if (-not (Test-Path $path)) {
    throw "Env file not found: $path"
  }

  foreach ($raw in (Get-Content $path)) {
    $line = $raw.Trim()
    if ($line.Length -eq 0) { continue }
    if ($line.StartsWith('#')) { continue }
    if ($line -notmatch '=') { continue }

    $name, $value = $line -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim()

    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ($value.StartsWith("'") -and $value.EndsWith("'")) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    if (-not [string]::IsNullOrWhiteSpace($name)) {
      $map[$name] = $value
    }
  }

  return $map
}

function Get-AuthHeaders {
  if (-not [string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
    return @{ "apikey" = $ServiceRoleKey; "Authorization" = "Bearer $ServiceRoleKey" }
  }

  if (-not [string]::IsNullOrWhiteSpace($AnonKey)) {
    return @{ "apikey" = $AnonKey; "Authorization" = "Bearer $AnonKey" }
  }

  return $null
}

function Invoke-SupabaseRestGet([string]$pathAndQuery, [hashtable]$headers) {
  $base = $SupabaseUrl.TrimEnd("/")
  $uri = "$base/rest/v1/$pathAndQuery"
  return Invoke-WebRequest -Method Get -Uri $uri -Headers $headers -UseBasicParsing
}

function Get-ExactCount([string]$pathAndQuery, [hashtable]$headers) {
  $countHeaders = @{}
  foreach ($key in $headers.Keys) { $countHeaders[$key] = $headers[$key] }
  $countHeaders["Prefer"] = "count=exact"

  $resp = Invoke-SupabaseRestGet -pathAndQuery $pathAndQuery -headers $countHeaders
  $contentRange = $resp.Headers["Content-Range"]

  if (-not [string]::IsNullOrWhiteSpace($contentRange) -and $contentRange.Contains("/")) {
    $total = $contentRange.Split("/")[-1]
    if ($total -match "^\d+$") {
      return [int]$total
    }
  }

  # Fallback: parse JSON and count items (may be slow on large tables)
  $json = $resp.Content | ConvertFrom-Json
  if ($null -eq $json) { return 0 }
  if ($json -is [System.Array]) { return $json.Length }
  return 1
}

if ([string]::IsNullOrWhiteSpace($SupabaseUrl)) {
  if (-not [string]::IsNullOrWhiteSpace($EnvFilePath)) {
    $envMap = Read-DotenvFile $EnvFilePath
    if ($envMap.ContainsKey('SUPABASE_URL')) {
      $SupabaseUrl = $envMap['SUPABASE_URL']
    }
    if ([string]::IsNullOrWhiteSpace($ServiceRoleKey) -and $envMap.ContainsKey('SUPABASE_SERVICE_ROLE_KEY')) {
      $ServiceRoleKey = $envMap['SUPABASE_SERVICE_ROLE_KEY']
    }
    if ([string]::IsNullOrWhiteSpace($AnonKey) -and $envMap.ContainsKey('SUPABASE_ANON_KEY')) {
      $AnonKey = $envMap['SUPABASE_ANON_KEY']
    }
  }
}

if ([string]::IsNullOrWhiteSpace($SupabaseUrl)) {
  throw "SUPABASE_URL is missing. Provide -SupabaseUrl, set SUPABASE_URL in your environment, or pass -EnvFilePath (e.g., ./server/.env)."
}

$headers = Get-AuthHeaders
if ($null -eq $headers) {
  throw "No API key provided. Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY, or pass -ServiceRoleKey/-AnonKey."
}

Write-Host "Verifying Supabase schema/seeds via REST..."
Write-Host ("Supabase URL: {0}" -f $SupabaseUrl)
Write-Host ("Auth: {0}" -f ($(if (-not [string]::IsNullOrWhiteSpace($ServiceRoleKey)) { "service-role" } else { "anon" })))
Write-Host ""

$overallOk = $true
$missingTables = New-Object System.Collections.Generic.List[string]

# 1) Table existence checks
foreach ($table in $RequiredTables) {
  try {
    $null = Invoke-SupabaseRestGet -pathAndQuery ("{0}?select=*&limit=1" -f $table) -headers $headers
    Write-Result "Table exists: $table" $true
  } catch {
    $overallOk = $false
    $missingTables.Add($table)
    $msg = $_.Exception.Message
    Write-Result "Table exists: $table" $false $msg
  }
}

Write-Host ""

# 2) Seed sanity checks (system defaults)
try {
  $resumeTemplateCount = Get-ExactCount -pathAndQuery "templates?select=id&user_id=is.null&category=eq.resume" -headers $headers
  $ok = $resumeTemplateCount -ge $MinSystemResumeTemplates
  if (-not $ok) { $overallOk = $false }
  Write-Result "System resume templates" $ok ("count=$resumeTemplateCount (min=$MinSystemResumeTemplates)")
} catch {
  $overallOk = $false
  Write-Result "System resume templates" $false $_.Exception.Message
}

try {
  $coverLetterTemplateCount = Get-ExactCount -pathAndQuery "templates?select=id&user_id=is.null&category=eq.cover-letter" -headers $headers
  $ok = $coverLetterTemplateCount -ge $MinSystemCoverLetterTemplates
  if (-not $ok) { $overallOk = $false }
  Write-Result "System cover letter templates" $ok ("count=$coverLetterTemplateCount (min=$MinSystemCoverLetterTemplates)")
} catch {
  $overallOk = $false
  Write-Result "System cover letter templates" $false $_.Exception.Message
}

try {
  $systemThemeCount = Get-ExactCount -pathAndQuery "themes?select=id&user_id=is.null" -headers $headers
  $ok = $systemThemeCount -ge $MinSystemThemes
  if (-not $ok) { $overallOk = $false }
  Write-Result "System themes" $ok ("count=$systemThemeCount (min=$MinSystemThemes)")
} catch {
  $overallOk = $false
  Write-Result "System themes" $false $_.Exception.Message
}

Write-Host ""

if ($overallOk) {
  Write-Host "All checks passed."
  exit 0
}

Write-Host "One or more checks failed."

if ($missingTables.Count -gt 0) {
  Write-Host "Missing tables detected:";
  Write-Host ("- " + ($missingTables -join "`n- "))

  $tableToMigrations = @{
      "accountability_partnerships" = @("db/migrations/2025-11-30_add_progress_sharing_schema.sql")
      "progress_messages" = @("db/migrations/2025-12-01_add_progress_messages_table.sql")
  }

  $recommended = New-Object System.Collections.Generic.List[string]
  foreach ($t in $missingTables) {
    if ($tableToMigrations.ContainsKey($t)) {
      foreach ($mig in $tableToMigrations[$t]) { $recommended.Add($mig) }
    }
  }

    if ($recommended.Count -gt 0) {
    $uniqueRecommended = $recommended | Select-Object -Unique
    Write-Host "Run these migration files in Supabase SQL Editor (in this order):"
    foreach ($mig in $uniqueRecommended) {
      Write-Host ("- " + $mig)
    }
  } else {
      Write-Host "Run the migration(s) that create the missing tables (see db/migrations/)."
      Write-Host "If many core tables are missing, you likely need to apply the latest schema rebuild migration (if your project is meant to match the current PRD schema):"
      Write-Host "- db/migrations/2025-11-17_ai_workspace_schema_redesign.sql"
  }
}

Write-Host "If system defaults are missing, re-run these seed migrations in Supabase SQL Editor:"
Write-Host "- db/migrations/2025-11-18_seed_default_templates.sql"
Write-Host "- db/migrations/2025-11-19_seed_default_themes.sql"
Write-Host "- db/migrations/2025-11-20_seed_cover_letter_templates.sql"
exit 1
