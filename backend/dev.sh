#!/usr/bin/env bash
set -e

echo "Starting PostgreSQL with Docker Compose..."
docker compose up -d

echo "Starting Monetria API..."
dotnet run --project Monetria.API/Monetria.API.csproj
