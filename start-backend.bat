@echo off
cd /d C:\github\medwork-manager\MedWork.Api
set ASPNETCORE_ENVIRONMENT=Testing
"C:\Program Files\dotnet\dotnet" run --launch-profile Testing --urls http://127.0.0.1:5279