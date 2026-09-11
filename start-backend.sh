#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Starting all services via Docker..."
echo "For logs: docker logs -f medwork-api"
echo "To stop: docker compose down"
echo ""
docker compose up -d
