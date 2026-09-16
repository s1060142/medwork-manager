@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   MedWork Manager - Avvio Rapido Applicazione
echo ============================================================
echo.

set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
set "BACKEND_DIR=%PROJECT_ROOT%\MedWork.Api"
set "FRONTEND_DIR=%PROJECT_ROOT%\medwork-frontend"
set "BACKEND_URL=http://127.0.0.1:5279"
set "FRONTEND_URL=http://localhost:5173"

echo [1/3] Controllo Backend...
netstat -ano | findstr ":5279.*LISTENING" >nul 2>&1
if !errorlevel! neq 0 (
    echo       Avvio Backend in corso...
    start "MedWork Backend" cmd /c "cd /d "%BACKEND_DIR%" && dotnet run --no-build --launch-profile Testing --urls %BACKEND_URL%"
) else (
    echo       Backend gia' attivo e in ascolto sulla porta 5279.
)

echo [2/3] Controllo Frontend...
netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
if !errorlevel! neq 0 (
    echo       Avvio Frontend in corso...
    start "MedWork Frontend" cmd /c "cd /d "%FRONTEND_DIR%" && npm run dev"
) else (
    echo       Frontend gia' attivo e in ascolto sulla porta 5173.
)

echo [3/3] Attesa inizializzazione Frontend...
for /L %%i in (1,1,10) do (
    netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
    if !errorlevel!==0 goto :ready
    timeout /t 1 /nobreak >nul 2>&1
)

:ready
echo.
echo ============================================================
echo   MedWork Manager pronto all'uso!
echo ============================================================
echo.
echo   URL Frontend: %FRONTEND_URL%
echo   URL Backend:  %BACKEND_URL%
echo.
echo   Credenziali di accesso predefinite:
echo     Medico:  doctor / Doctor123!
echo     Admin:   admin  / Admin123!
echo.
echo   Apertura automatica del browser in corso...
start "" "%FRONTEND_URL%"