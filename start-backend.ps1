# Start backend API via Docker
$ErrorActionPreference = 'Stop'
Write-Host "Starting backend API via Docker..."

Write-Host "Running: docker compose up -d sqlserver backend"
Write-Host "To view logs: docker logs -f medwork-api"
Write-Host "To stop: docker compose down"
Write-Host ""

docker compose up -d sqlserver backend

Write-Host "Backend started in Docker!"
Write-Host "API: http://localhost:5279"
Write-Host "To view logs: docker logs -f medwork-api"
Write-Host "To stop: docker compose down"
