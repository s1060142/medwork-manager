@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   MedWork Manager - Avvio Rapido (Host + SQLite DB)
echo ============================================================
echo.

set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
set "BACKEND_DIR=%PROJECT_ROOT%\MedWork.Api"
set "FRONTEND_DIR=%PROJECT_ROOT%\medwork-frontend"
set "BACKEND_URL=http://localhost:5279"
set "FRONTEND_URL=http://localhost:5173"

:: 1. Controllo / Avvio Backend .NET (Host con SQLite)
echo [1/3] Controllo Backend .NET (Host)...
netstat -ano | findstr ":5279" >nul 2>&1
if !errorlevel! neq 0 (
    echo       Avvio Backend in corso [profilo Development / SQLite: medwork.db]...
    start "MedWork Backend" /D "%BACKEND_DIR%" cmd /k "set ASPNETCORE_ENVIRONMENT=Development && dotnet run --launch-profile Development"
) else (
    echo       Backend gia' attivo e in ascolto sulla porta 5279.
)

:: 2. Controllo / Avvio Frontend Vite (Host)
echo [2/3] Controllo Frontend Vite (Host)...
netstat -ano | findstr ":5173" >nul 2>&1
if !errorlevel! neq 0 (
    echo       Avvio Frontend in corso [Host - npm run dev]...
    start "MedWork Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"
) else (
    echo       Frontend gia' attivo e in ascolto sulla porta 5173.
)

:: 3. Attesa inizializzazione Frontend
echo [3/3] Attesa inizializzazione Frontend...
for /L %%i in (1,1,15) do (
    netstat -ano | findstr ":5173" >nul 2>&1
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
echo   URL Backend:  %BACKEND_URL% (Swagger: %BACKEND_URL%/swagger)
echo   Database:     SQLite locale (MedWork.Api\medwork.db)
echo.
echo   Credenziali di accesso predefinite:
echo     Medico:  doctor / Doctor123!
echo     Admin:   admin  / Admin123!
echo.
echo   Apertura automatica del browser in corso...
start "" "%FRONTEND_URL%"