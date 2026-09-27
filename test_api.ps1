$body = '{"username":"doctor","password":"Doctor123!","tenantSlug":"default","rememberMe":false}'
$login = Invoke-RestMethod -Uri "http://127.0.0.1:5279/api/auth/login" -Method Post -Body $body -ContentType "application/json"
Write-Host "Role:" $login.role
Write-Host "TenantId:" $login.tenantId
Write-Host "Token:" $login.accessToken.Substring(0, 30) "..."

$headers = @{ "Authorization" = "Bearer " + $login.accessToken }
try {
    $emp = Invoke-RestMethod -Uri "http://127.0.0.1:5279/api/master-data/employees" -Method Get -Headers $headers
    Write-Host "Employees count:" $emp.Count
} catch {
    Write-Host "Employees request failed:" $_.Exception.Response.StatusCode $_.Exception.Message
}
