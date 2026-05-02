# Monetria Backend

Backend API for Monetria built with ASP.NET Core, EF Core, JWT authentication, and PostgreSQL.

## Requirements

- Docker and Docker Compose
- .NET 10 SDK

## Run Locally

From the `backend` folder:

```bash
./dev.sh
```

The script starts PostgreSQL, waits until it is healthy, restores local .NET tools, applies EF Core migrations, and starts the API.

Useful URLs:

- Swagger UI: `http://localhost:5245/swagger`
- PostgreSQL: `localhost:5432`

## Database

PostgreSQL runs through `docker-compose.yml` with these development values:

- Database: `monetria_dev`
- User: `postgres`
- Password: `postgres`

Apply migrations manually:

```bash
dotnet tool restore
dotnet tool run dotnet-ef database update \
  --project Monetria.Infrastructure/Monetria.Infrastructure.csproj \
  --startup-project Monetria.API/Monetria.API.csproj
```

Connect with `psql`:

```bash
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d monetria_dev
```

Or with Docker:

```bash
docker exec -it monetria-postgres psql -U postgres -d monetria_dev
```

## Authentication

1. Create a user with `POST /auth/register`.
2. Log in with `POST /auth/login`.
3. Copy the returned token.
4. In Swagger, click **Authorize** and use:

```text
Bearer <token>
```

Authenticated endpoints resolve the user from JWT claims, so request bodies should not include `UserId`.
