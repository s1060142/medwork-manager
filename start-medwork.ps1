$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "MedWork.Api"
$FrontendDir = Join-Path $ProjectRoot "medwork-frontend"
$BackendUrl = "http://localhost:5279"
$FrontendUrl = "http://localhost:5173"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MedWork Manager - Avvio Rapido (Host + SQLite DB)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Backend
Write-Host "[1/3] Controllo Backend .NET (Host)..." -ForegroundColor Yellow
$backendListening = Get-NetTCPConnection -LocalPort 5279 -ErrorAction SilentlyContinue
if (-not $backendListening) {
    Write-Host "      Avvio Backend in corso (profilo Development / SQLite: medwork.db)..." -ForegroundColor Green
    Start-Process cmd.exe -ArgumentList "/k", "set ASPNETCORE_ENVIRONMENT=Development && dotnet run --launch-profile Development" -WorkingDirectory $BackendDir
} else {
    Write-Host "      Backend gia' attivo e in ascolto sulla porta 5279." -ForegroundColor Gray
}

# 2. Frontend
Write-Host "[2/3] Controllo Frontend Vite (Host)..." -ForegroundColor Yellow
$frontendListening = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if (-not $frontendListening) {
    Write-Host "      Avvio Frontend in corso (Host - npm run dev)..." -ForegroundColor Green
    Start-Process cmd.exe -ArgumentList "/k", "npm run dev" -WorkingDirectory $FrontendDir
} else {
    Write-Host "      Frontend gia' attivo e in ascolto sulla porta 5173." -ForegroundColor Gray
}

# 3. Attesa
Write-Host "[3/3] Attesa inizializzazione Frontend..." -ForegroundColor Yellow
$count = 0
while ($count -lt 15) {
    $frontendListening = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($frontendListening) { break }
    Start-Sleep -Seconds 1
    $count++
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MedWork Manager pronto all'uso!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  URL Frontend: $FrontendUrl"
Write-Host "  URL Backend:  $BackendUrl (Swagger: $BackendUrl/swagger)"
Write-Host "  Database:     SQLite locale (MedWork.Api\medwork.db)"
Write-Host ""
Write-Host "  Credenziali di accesso predefinite:"
Write-Host "    Medico:  doctor / Doctor123!"
Write-Host "    Admin:   admin  / Admin123!"
Write-Host ""
Write-Host "  Apertura automatica del browser in corso..." -ForegroundColor Green
Start-Process $FrontendUrl
