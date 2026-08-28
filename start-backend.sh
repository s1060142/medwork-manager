#!/usr/bin/env bash
cd "$(dirname "$0")/MedWork.Api"
echo "Starting backend API..."
dotnet run --project MedWork.Api.csproj --environment Testing --urls http://127.0.0.1:5279
