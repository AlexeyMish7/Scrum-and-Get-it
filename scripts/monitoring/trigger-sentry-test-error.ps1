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
  $status = $null
  $bodyText = $null
  if ($_.Exception.Response) {
    try { $status = $_.Exception.Response.StatusCode.value__ } catch {}
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $bodyText = $reader.ReadToEnd()
      }
    } catch {}
  }

  # Expected: endpoint returns HTTP 500.
  if ($status -eq 500) {
    Write-Host "OK: got HTTP 500 (intentional)." -ForegroundColor Green
    if ($bodyText) {
      Write-Host "Response body:" -ForegroundColor Green
      $bodyText | Write-Host
    }
    Write-Host "Now check Sentry for a new issue + alert." -ForegroundColor Green
    return
  }

  if ($status) {
    Write-Host "HTTP status: $status" -ForegroundColor Red
  }
  if ($bodyText) {
    Write-Host "Response body:" -ForegroundColor Red
    $bodyText | Write-Host
  }

  Write-Host "Request failed (not the expected 500)." -ForegroundColor Red
  Write-Host "- If you see 401: your token is wrong." -ForegroundColor Yellow
  Write-Host "- If you see 404 + JSON {\"error\":\"Not Found\"}: MONITORING_TEST_TOKEN is missing in the running Render service (restart/redeploy)." -ForegroundColor Yellow
  Write-Host "- If you see an HTML 404 page: the deployed backend likely doesn't include this route yet (deploy latest commit / check Render start command)." -ForegroundColor Yellow
  throw
}
