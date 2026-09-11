@echo off
setlocal

echo ============================================================
echo   MedWork Manager - Avvio Backend tramite Docker
echo ============================================================
echo.

echo Avvio dei servizi Docker (backend e database)...
echo Per vedere i log: docker logs -f medwork-api
echo Per fermare: docker compose down
echo.

docker compose up -d sqlserver backend

echo.
echo Backend avviato in Docker!
echo   API: http://localhost:5279
echo   Per vedere i log: docker logs -f medwork-api
echo   Per fermare tutti i servizi: docker compose down
echo.

pause
