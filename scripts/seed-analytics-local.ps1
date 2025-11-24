# Local seed script that avoids the PowerShell `$Host` name conflict
param(
  [Parameter(Mandatory=$true)]
  [string]$UserId,

  [string]$ApiHost = "http://localhost:8787"
)

function Post-Payload($payload) {
  $json = $payload | ConvertTo-Json -Depth 8
  Write-Host "POSTing payload for interview" $payload.interview.id
  try {
    $res = Invoke-RestMethod -Uri ("$ApiHost/api/analytics/ingest") -Method Post -ContentType 'application/json' -Body $json
    Write-Host "-> OK:" ($res | ConvertTo-Json -Depth 5)
  } catch {
    Write-Host "-> ERROR:" $_.Exception.Message -ForegroundColor Red
  }
}

$items = @()
$items += @{ interview = @{ id = "10000000-0000-4000-8000-000000000001"; user_id = $UserId; company = "Acme"; industry = "Software"; role = "Frontend Engineer"; interview_date = "2025-07-15T10:00:00Z"; format = "video"; interview_type = "technical"; result = $true; score = 85 }; feedbacks = @(@{ provider = "mock-coach"; feedback_text = "Work on time management"; themes = @("time-management"); rating = 4 }); confidenceLogs = @(@{ user_id = $UserId; interview_id = "10000000-0000-4000-8000-000000000001"; logged_at = "2025-07-14T20:00:00Z"; confidence_level = 7; anxiety_level = 3; notes = "Felt OK" }) }
$items += @{ interview = @{ id = "10000000-0000-4000-8000-000000000002"; user_id = $UserId; company = "Beta"; industry = "Fintech"; role = "Backend Engineer"; interview_date = "2025-08-10T11:00:00Z"; format = "phone"; interview_type = "screening"; result = $false; score = 60 }; feedbacks = @(@{ provider = "interviewer"; feedback_text = "Need clearer explanations"; themes = @("communication"); rating = 3 }); confidenceLogs = @(@{ user_id = $UserId; interview_id = "10000000-0000-4000-8000-000000000002"; logged_at = "2025-08-09T19:00:00Z"; confidence_level = 5; anxiety_level = 5; notes = "Nervous" }) }
$items += @{ interview = @{ id = "10000000-0000-4000-8000-000000000003"; user_id = $UserId; company = "Gamma"; industry = "Enterprise"; role = "Fullstack"; interview_date = "2025-09-20T14:00:00Z"; format = "take-home"; interview_type = "system-design"; result = $true; score = 90 }; feedbacks = @(@{ provider = "interviewer"; feedback_text = "Excellent architecture"; themes = @("system-design"); rating = 5 }); confidenceLogs = @(@{ user_id = $UserId; interview_id = "10000000-0000-4000-8000-000000000003"; logged_at = "2025-09-19T21:00:00Z"; confidence_level = 8; anxiety_level = 2; notes = "Good" }) }
$items += @{ interview = @{ id = "10000000-0000-4000-8000-000000000004"; user_id = $UserId; company = "Acme"; industry = "Software"; role = "Frontend Engineer"; interview_date = "2025-10-05T09:00:00Z"; format = "onsite"; interview_type = "behavioral"; result = $false; score = 70 }; feedbacks = @(@{ provider = "interviewer"; feedback_text = "Practice STAR method"; themes = @("behavioral","communication"); rating = 3 }); confidenceLogs = @(@{ user_id = $UserId; interview_id = "10000000-0000-4000-8000-000000000004"; logged_at = "2025-10-04T20:00:00Z"; confidence_level = 6; anxiety_level = 4; notes = "Okay" }) }
$items += @{ interview = @{ id = "10000000-0000-4000-8000-000000000005"; user_id = $UserId; company = "Delta"; industry = "Software"; role = "Frontend Engineer"; interview_date = "2025-11-01T13:00:00Z"; format = "video"; interview_type = "technical"; result = $false; score = 75 }; feedbacks = @(@{ provider = "mock-coach"; feedback_text = "Improve time estimation"; themes = @("time-management","estimations"); rating = 4 }); confidenceLogs = @(@{ user_id = $UserId; interview_id = "10000000-0000-4000-8000-000000000005"; logged_at = "2025-10-31T21:00:00Z"; confidence_level = 6; anxiety_level = 4; notes = "Tired" }) }

foreach ($it in $items) {
  Post-Payload $it
}

Write-Host "Seeding complete. Open http://localhost:5173/profile/analytics?userId=$UserId to view dashboard." -ForegroundColor Green
