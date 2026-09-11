@echo off
setlocal

echo ============================================================
echo   MedWork Manager - Avvio completo tramite Docker
echo ============================================================
echo.

echo Avvio di tutti i servizi Docker (SQL Server, Backend, Frontend)...
echo I dati sono salvati nel container SQL Server Docker.
echo Per vedere i log: docker logs -f medwork-api
echo Per fermare: docker compose down
echo.

docker compose up -d

echo.
echo MedWork Manager avviato con successo!
echo.
echo   URL Frontend: http://localhost:5173
echo   URL Backend:  http://localhost:5279
echo.
echo   Credenziali di accesso:
echo     Medico:  doctor / Doctor123!
echo     Admin:   admin  / Admin123!
echo.
echo   Per fermare l'applicazione: docker compose down
echo.

pause

start "" "http://localhost:5173"

echo.
echo   Se il browser non si apre automaticamente, vai a:
echo   http://localhost:5173
echo.
pause