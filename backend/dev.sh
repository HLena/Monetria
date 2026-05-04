#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TOOL_MANIFEST="$REPO_ROOT/.config/dotnet-tools.json"
cd "$SCRIPT_DIR"

run_dotnet_ef() {
  local output

  if ! output="$(dotnet tool run dotnet-ef "$@" 2>&1)"; then
    echo "$output" >&2
    echo "Failed to run dotnet-ef from $TOOL_MANIFEST." >&2
    echo "If the tool was restored but still cannot run, clear the stale resolver cache:" >&2
    echo "  rm \"\$HOME/.dotnet/toolResolverCache/1/dotnet-ef\" && dotnet tool restore --tool-manifest \"$TOOL_MANIFEST\"" >&2
    return 1
  fi

  echo "$output"
}

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
dotnet tool restore --tool-manifest "$TOOL_MANIFEST"

echo "Applying EF Core migrations..."
run_dotnet_ef database update \
  --project "$SCRIPT_DIR/Monetria.Infrastructure/Monetria.Infrastructure.csproj" \
  --startup-project "$SCRIPT_DIR/Monetria.API/Monetria.API.csproj"

echo "Swagger UI: http://localhost:5245/swagger"
echo "PostgreSQL: localhost:5432"
echo "Starting Monetria API..."
dotnet run --project Monetria.API/Monetria.API.csproj
