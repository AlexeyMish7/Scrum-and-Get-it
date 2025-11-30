# Verify salary tracking columns exist in job_notes table
Write-Host "Checking job_notes table structure..." -ForegroundColor Cyan

# Load environment variables
Get-Content server\.env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Split('#')[0].Trim()
        Set-Item -Path "env:$key" -Value $value
    }
}

$url = "$env:SUPABASE_URL/rest/v1/job_notes?select=*&limit=1"
$headers = @{
    "apikey" = $env:SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
}

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    Write-Host "`nSuccess! Sample row structure:" -ForegroundColor Green
    
    if ($response.Count -gt 0) {
        $row = $response[0]
        Write-Host "`nChecking for new columns:" -ForegroundColor Yellow
        
        $newColumns = @('offered_salary', 'negotiated_salary', 'offer_received_date', 'negotiation_outcome', 'total_compensation_breakdown')
        foreach ($col in $newColumns) {
            if ($row.PSObject.Properties.Name -contains $col) {
                Write-Host "  ✓ $col exists" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $col MISSING" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "`nNo rows in table yet. Checking columns via error method..." -ForegroundColor Yellow
        # Try to insert with new columns to see if they exist
        Write-Host "  (Cannot verify without data - please check Supabase dashboard)" -ForegroundColor Gray
    }
} catch {
    Write-Host "`nError querying database:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
