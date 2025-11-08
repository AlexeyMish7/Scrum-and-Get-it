<#
Call the local AI orchestrator POST /api/generate/resume endpoint.

Usage examples:
  # default values
  .\generate-resume.ps1

  # custom user id and job id
  .\generate-resume.ps1 -UserId '11111111-1111-1111-1111-111111111111' -JobId 42

The script uses Invoke-RestMethod and prints the response JSON.
#>

param(
  [string]$UserId = '00000000-0000-0000-0000-000000000000',
  [int]$JobId = 123,
  [string]$BaseUrl = 'http://localhost:8787'
)

Set-StrictMode -Version Latest

$headers = @{
  'Content-Type' = 'application/json'
  'X-User-Id' = $UserId
}

$body = @{ jobId = $JobId } | ConvertTo-Json

Write-Host "Posting to $BaseUrl/api/generate/resume with UserId=$UserId JobId=$JobId"
try {
  $resp = Invoke-RestMethod -Uri "$BaseUrl/api/generate/resume" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
  Write-Host "Response:`n" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Error "Request failed: $_"
}
