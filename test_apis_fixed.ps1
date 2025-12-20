# Test APIs with new base URL
# ⚠️ UPDATE THIS URL WHEN YOUR NEW BACKEND IS READY
$baseUrl = ""  # TODO: Add your new backend URL here (e.g., "https://your-domain.com/api")

if (-not $baseUrl) {
    Write-Host "❌ BASE URL is not configured. Please update this file with your new backend URL." -ForegroundColor Red
    Write-Host "📝 Edit line 2 of this file and add your backend URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "Testing APIs with Base URL: $baseUrl" -ForegroundColor Green
Write-Host "============================================================"

# Test 1: Register API
Write-Host "`nTesting REGISTER API..." -ForegroundColor Yellow
$registerUrl = "$baseUrl/auth/register"
$registerBody = @{
    name = "Test User"
    email = "testuser$(Get-Random)@example.com"
    password = "password123"
    role = "customer"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $registerBody
    Write-Host "REGISTER API Response:" -ForegroundColor Green
    $registerResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "REGISTER API Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n============================================================"

# Test 2: Login API
Write-Host "`nTesting LOGIN API..." -ForegroundColor Yellow
$loginUrl = "$baseUrl/auth/login"
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    Write-Host "LOGIN API Response:" -ForegroundColor Green
    $loginResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "LOGIN API Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n============================================================"

# Summary
Write-Host "`nAPI Endpoints Summary:" -ForegroundColor Cyan
Write-Host "Register URL: $registerUrl"
Write-Host "Login URL: $loginUrl"
Write-Host "`nTest completed!" -ForegroundColor Green