@echo off
setlocal

echo ============================================================
echo   MedWork Manager - Avvio Backend (Testing / InMemory)
echo ============================================================
echo.

set "PROJECT_ROOT=C:\github\medwork-manager"
set "BACKEND_DIR=%PROJECT_ROOT%\MedWork.Api"
set "DOTNET=%ProgramFiles%\dotnet\dotnet.exe"

cd /d "%BACKEND_DIR%"

echo [Backend] Controllo se il backend e gia in esecuzione sulla porta 5279...
netstat -ano | findstr ":5279.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo ERRORE: Il backend sembra gia attivo su porta 5279.
    echo       Chiudi MedWork.Api.exe prima di riavviare.
    pause
    exit /b 1
)

echo [Backend] Build...
"%DOTNET%" build --no-restore
if %errorlevel% neq 0 (
    echo ERRORE: Build backend fallita.
    pause
    exit /b 1
)

echo [Backend] Avvio su http://127.0.0.1:5279 ...
echo       (premi Ctrl+C qui per fermare il backend)
echo.

set ASPNETCORE_ENVIRONMENT=Testing
"%DOTNET%" run --no-build --launch-profile Testing --urls http://127.0.0.1:5279

pause
