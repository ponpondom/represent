# Test script to diagnose Google Civic Information API access issues
# Run: .\test-civic-api.ps1

$KEY = "AIzaSyA97AQ5ZyjCQ1SgIqjsGIQi38UnJ8OVPXM"
$ADDR = [uri]::EscapeDataString("1600 Pennsylvania Ave NW, Washington DC 20500")

Write-Host "`n=== Test 1: Discovery Document (proves key format is valid) ===" -ForegroundColor Cyan
try {
    $disc = Invoke-RestMethod -Method GET -Uri "https://civicinfo.googleapis.com/`$discovery/rest?version=v2&key=$KEY"
    Write-Host "SUCCESS: $($disc.version) - $($disc.canonicalName)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Response.StatusCode.value__) - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test 2: Representatives WITHOUT key (proves method exists) ===" -ForegroundColor Cyan
try {
    $noKeyResp = Invoke-WebRequest -UseBasicParsing -Method GET -Uri "https://www.googleapis.com/civicinfo/v2/representatives?address=$ADDR"
    Write-Host "UNEXPECTED SUCCESS: $($noKeyResp.StatusCode)" -ForegroundColor Yellow
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 403) {
        Write-Host "EXPECTED 403: Method exists but requires authentication" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: $status" -ForegroundColor Red
    }
}

Write-Host "`n=== Test 3: Representatives WITH key (www.googleapis.com) ===" -ForegroundColor Cyan
try {
    $reps = Invoke-RestMethod -Method GET -Uri "https://www.googleapis.com/civicinfo/v2/representatives?key=$KEY&address=$ADDR"
    Write-Host "SUCCESS: Found $($reps.offices.Count) offices" -ForegroundColor Green
    Write-Host "Normalized: $($reps.normalizedInput | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "FAILED: $status" -ForegroundColor Red
    Write-Host "Body: $($body.Substring(0, [Math]::Min(300, $body.Length)))" -ForegroundColor Gray
}

Write-Host "`n=== Test 4: Representatives WITH key (civicinfo.googleapis.com) ===" -ForegroundColor Cyan
try {
    $reps2 = Invoke-RestMethod -Method GET -Uri "https://civicinfo.googleapis.com/civicinfo/v2/representatives?key=$KEY&address=$ADDR"
    Write-Host "SUCCESS: Found $($reps2.offices.Count) offices" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "FAILED: $status" -ForegroundColor Red
    Write-Host "Body: $($body.Substring(0, [Math]::Min(300, $body.Length)))" -ForegroundColor Gray
}

Write-Host "`n=== Diagnosis ===" -ForegroundColor Cyan
Write-Host "If Test 1 succeeds but Tests 3 & 4 both return 404 'Method not found':"
Write-Host "  1. Go to https://console.cloud.google.com and verify the project picker shows 'represent-app-9978c'"
Write-Host "  2. Go to APIs & Services > Enabled APIs and search for 'Civic Information API' - it must show ENABLED"
Write-Host "  3. Go to APIs & Services > Credentials, find your key, click it, and verify:"
Write-Host "     - Application restrictions: None (for server-side use)"
Write-Host "     - API restrictions: Don't restrict key (or Civic Information API only)"
Write-Host "  4. If still failing, DELETE the key and create a brand new one in the SAME project"
Write-Host "  5. Try a completely different Google Cloud project as a sanity check"
Write-Host "`nIf Test 2 returns 404 instead of 403:"
Write-Host "  - The Civic Information API might be deprecated or sunset (check Google's status page)"
Write-Host "  - Your region/org might have restrictions blocking the API entirely"
