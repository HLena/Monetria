#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting PostgreSQL with Docker Compose..."
docker compose up -d

echo "Waiting for PostgreSQL to become healthy..."
for _ in {1..30}; do
  status="$(docker inspect --format='{{.State.Health.Status}}' monetria-postgres 2>/dev/null || true)"
  if [[ "$status" == "healthy" ]]; then
    echo "PostgreSQL is healthy."
    break
  fi

  sleep 2
done

status="$(docker inspect --format='{{.State.Health.Status}}' monetria-postgres 2>/dev/null || true)"
if [[ "$status" != "healthy" ]]; then
  echo "PostgreSQL did not become healthy in time." >&2
  exit 1
fi

echo "Restoring local .NET tools..."
dotnet tool restore

echo "Applying EF Core migrations..."
dotnet tool run dotnet-ef database update \
  --project Monetria.Infrastructure/Monetria.Infrastructure.csproj \
  --startup-project Monetria.API/Monetria.API.csproj

echo "Swagger UI: http://localhost:5245/swagger"
echo "PostgreSQL: localhost:5432"
echo "Starting Monetria API..."
dotnet run --project Monetria.API/Monetria.API.csproj
