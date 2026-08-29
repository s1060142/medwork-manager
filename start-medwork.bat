@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   MedWork Manager - Avvio completo per medico tester
echo ============================================================
echo.

set "PROJECT_ROOT=C:\github\medwork-manager"
set "BACKEND_DIR=%PROJECT_ROOT%\MedWork.Api"
set "FRONTEND_DIR=%PROJECT_ROOT%\medwork-frontend"
set "BACKEND_URL=http://127.0.0.1:5279"
set "FRONTEND_URL=http://localhost:5173"

set "DOTNET=%ProgramFiles%\dotnet\dotnet.exe"
set "NPM=npm"
set "NODE=node"

echo [1/6] Controllo prerequisiti...

if not exist "%DOTNET%" (
    echo.
    echo ERRORE: .NET SDK non trovato.
    echo       Installa .NET 10 SDK da https://dotnet.microsoft.com/download
    echo.
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERRORE: Node.js non trovato.
    echo       Installa Node.js 20 LTS da https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo       .NET SDK e Node.js: OK
echo.

echo [2/6] Controllo porte libere...

netstat -ano | findstr ":5279.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo ATTENZIONE: Porta 5279 (backend) gia in uso.
    echo       Verifica che non ci sia gia MedWork.Api in esecuzione.
    echo       Se si, chiudi la finestra "MedWork Backend" e riprova.
    echo.
    pause
    exit /b 1
)

netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo ATTENZIONE: Porta 5173 (frontend) gia in uso.
    echo       Verifica che non ci sia gia Vite in esecuzione.
    echo       Se si, chiudi la finestra "MedWork Frontend" e riprova.
    echo.
    pause
    exit /b 1
)

echo       Porte libere.
echo.

echo [3/6] Build backend...
pushd "%BACKEND_DIR%"
"%DOTNET%" build --no-restore
if %errorlevel% neq 0 (
    echo.
    echo ERRORE: Build backend fallita. Controlla i log sopra.
    popd
    pause
    exit /b 1
)
popd
echo       Build backend completata.
echo.

echo [4/6] Build frontend...
pushd "%FRONTEND_DIR%"
call "%NPM%" run build
if %errorlevel% neq 0 (
    echo.
    echo ERRORE: Build frontend fallita. Controlla i log sopra.
    popd
    pause
    exit /b 1
)
popd
echo       Build frontend completata.
echo.

echo [5/6] Avvio servizi...

echo       Avvio backend...
start "MedWork Backend" /min cmd /c "cd /d "%BACKEND_DIR%" && set ASPNETCORE_ENVIRONMENT=Testing && "%DOTNET%" run --no-build --urls %BACKEND_URL%"

echo       Attendo 8 secondi per l'avvio del backend...
timeout /t 8 /nobreak >nul

echo       Avvio frontend...
start "MedWork Frontend" /min cmd /c "cd /d "%FRONTEND_DIR%" && "%NPM%" run dev"

echo       Attendo 5 secondi per l'avvio del frontend...
timeout /t 5 /nobreak >nul

echo.
echo [6/6] Apertura browser...
echo.
echo ============================================================
echo   MedWork Manager avviato con successo!
echo ============================================================
echo.
echo   URL: %FRONTEND_URL%
echo.
echo   Credenziali di accesso:
echo     Medico:  doctor / Doctor123!
echo     Admin:   admin  / Admin123!
echo.
echo   Note:
echo   - Il database e in-memory (non richiede SQL Server).
echo   - I dati di esempio sono caricati automaticamente.
echo   - Per fermare l'applicazione, chiudi le finestre
echo     "MedWork Backend" e "MedWork Frontend".
echo.
echo   Premi un tasto per aprire il browser...
pause >nul

start "" "%FRONTEND_URL%"

echo.
echo   Se il browser non si apre automaticamente, vai a:
echo   %FRONTEND_URL%
echo.
pause
