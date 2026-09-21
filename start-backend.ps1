# Launch backend locally on host with SQLite
$ErrorActionPreference = 'Stop'

Write-Host "Starting MedWork API on Host (Development profile / SQLite)..."
$backendDir = Join-Path $PSScriptRoot "MedWork.Api"
Set-Location $backendDir
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --launch-profile Development
