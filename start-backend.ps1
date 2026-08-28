# Start backend API in Testing mode with proper environment variable
$ErrorActionPreference = 'Stop'
Write-Host "Starting backend API in Testing mode..."

Set-Location $PSScriptRoot/MedWork.Api
$env:ASPNETCORE_ENVIRONMENT = 'Testing'

$dotnetExe = "C:\Program Files\dotnet\dotnet.exe"
$project = "MedWork.Api.csproj"
$logFile = Join-Path $PSScriptRoot "backend.log"

Write-Host "Running: dotnet run --project $project --launch-profile Testing --urls http://127.0.0.1:5279"
Write-Host "Logging to: $logFile"

# Use & call operator to invoke the executable.
# *>> redirects both stdout and stderr to the log file.
& $dotnetExe run --project $project --launch-profile Testing --urls http://127.0.0.1:5279 *>> $logFile
