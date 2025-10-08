# Test Rate Limiting
Write-Host "🧪 Testing Rate Limiting..."

$loginUrl = "http://localhost:5173/api/auth/login"
$body = '{"email":"test@example.com","password":"wrong"}'
$headers = @{
    "Content-Type" = "application/json"
}

$rateLimited = $false

for ($i = 1; $i -le 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $loginUrl -Method POST -Body $body -Headers $headers -ErrorAction Stop
        Write-Host "Attempt $i : Status $($response.StatusCode)"

        if ($response.StatusCode -eq 429) {
            Write-Host "✅ Rate limiting triggered!"
            Write-Host "Response:" $response.Content
            $rateLimited = $true
            break
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Attempt $i : Status $statusCode"

        if ($statusCode -eq 429) {
            Write-Host "✅ Rate limiting triggered!"
            Write-Host "Response:" $_.Exception.Response
            $rateLimited = $true
            break
        }
    }

    # Small delay between requests
    Start-Sleep -Milliseconds 100
}

if (-not $rateLimited) {
    Write-Host "❌ Rate limiting did not trigger after 60 attempts"
}