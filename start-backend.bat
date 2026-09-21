@echo off
setlocal

echo ============================================================
echo   MedWork Manager - Avvio Backend su Host (SQLite)
echo ============================================================
echo.
echo Avvio del backend .NET sull'host (profilo Development / SQLite: medwork.db)...
cd /d "%~dp0MedWork.Api"
set ASPNETCORE_ENVIRONMENT=Development
dotnet run --launch-profile Development
