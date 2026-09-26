# Launch backend locally on host with SQLite
$ErrorActionPreference = 'Stop'

Write-Host "Starting MedWork API on Host (Development profile / SQLite)..."
$backendDir = Join-Path $PSScriptRoot "MedWork.Api"

# Preflight: verifica che la porta 5279 non sia riservata da Windows (Hyper-V/WSL/Docker).
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'fix-dev-ports.ps1') -CheckOnly -Ports 5279
if ($LASTEXITCODE -ne 0) {
    Write-Host "Impossibile avviare il backend: porta riservata dal sistema operativo." -ForegroundColor Red
    Write-Host "Rimedio: powershell -ExecutionPolicy Bypass -File .\fix-dev-ports.ps1" -ForegroundColor Yellow
    exit 1
}

Set-Location $backendDir
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --launch-profile Development
