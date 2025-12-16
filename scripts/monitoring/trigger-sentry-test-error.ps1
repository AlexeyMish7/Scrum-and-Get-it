param(
  [Parameter(Mandatory = $true)]
  [string]$BackendBaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$MonitoringTestToken
)

$ErrorActionPreference = 'Stop'

# Normalize base URL (avoid trailing slash)
$base = $BackendBaseUrl.TrimEnd('/')
$url = "$base/api/monitoring/test-error"

Write-Host "Triggering intentional monitoring error at: $url" -ForegroundColor Cyan

$headers = @{
  Authorization = "Bearer $MonitoringTestToken"
  'Content-Type' = 'application/json'
}

try {
  $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body "{}"
  Write-Host "Unexpected success response:" -ForegroundColor Yellow
  $resp | ConvertTo-Json -Depth 6 | Write-Host
} catch {
  # Expected: endpoint returns HTTP 500.
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 500) {
    Write-Host "OK: got HTTP 500 (intentional). Now check Sentry for a new issue + alert." -ForegroundColor Green
    return
  }

  Write-Host "Request failed (not the expected 500). Double-check MONITORING_TEST_TOKEN." -ForegroundColor Red
  throw
}
