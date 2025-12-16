param(
  [Parameter(Mandatory = $true)]
  [string]$BackendBaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$MetricsToken,

  [int]$WindowSeconds = 300
)

$ErrorActionPreference = 'Stop'

# Normalize base URL (avoid trailing slash)
$base = $BackendBaseUrl.TrimEnd('/')
$url = "$base/api/metrics?window=$WindowSeconds"

Write-Host "Fetching metrics from: $url" -ForegroundColor Cyan

$headers = @{
  Authorization = "Bearer $MetricsToken"
}

try {
  $resp = Invoke-RestMethod -Method Get -Uri $url -Headers $headers
} catch {
  Write-Host "Request failed. Double-check BackendBaseUrl + METRICS_TOKEN." -ForegroundColor Red
  throw
}

Write-Host "\n=== Totals (last $($resp.window_seconds)s) ===" -ForegroundColor Green
$totals = $resp.totals
$totals | ConvertTo-Json -Depth 6 | Write-Host

Write-Host "\n=== Top routes (by count) ===" -ForegroundColor Green
$resp.by_route | Select-Object -First 10 | Format-Table -AutoSize

Write-Host "\nTip: If totals show lots of 5xx, check Sentry + Render logs." -ForegroundColor Yellow
