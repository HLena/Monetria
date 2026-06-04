# API — ASP.NET Core Backend

## Stack
- .NET 10 / C# 13
- ASP.NET Core Minimal APIs
- Entity Framework Core 10
- PostgreSQL
- JWT Bearer + BCrypt

## Architecture — Clean Architecture
Monetria.API/            ← thin endpoints, no business logic
Monetria.Application/    ← services, interfaces, DTOs (sealed records)
Monetria.Domain/         ← pure entities and enums, no dependencies
Monetria.Infrastructure/ ← EF Core, repositories, JWT, BCrypt
Monetria.Tests/          ← unit tests

## Conventions
- English only — entities, methods, variables, comments
- DTOs: sealed records in Application/<Feature>/<Feature>Dtos.cs
- Services: IService + Service in Application/<Feature>/
- One repository interface per entity in Application/<Feature>/
- Soft delete: IsActive = false — never DELETE financial records
- Monetary amounts: decimal(18,2) always
- Interest rates: decimal(9,4)
- IDs: Guid
- Timestamps: DateTime UTC
- Calendar dates: DateOnly

## Migrations
Always run from monorepo root:
```bash
dotnet ef migrations add <Name> --project apps/api/Monetria.Infrastructure --startup-project apps/api/Monetria.API
dotnet ef database update --project apps/api/Monetria.Infrastructure --startup-project apps/api/Monetria.API
```

## Critical Rules
- NEVER float/double for money — always decimal(18,2)
- NEVER hard delete — IsActive = false
- Transfers MUST be 2 atomic Transaction rows in one UnitOfWork
- Budget CategoryId must be real FK to Category table — never string/enum
- Debt payment must create Transaction + reduce RemainingAmount in one UnitOfWork
- Account balance is always calculated — never stored as column

## Entity Change Checklist
1. Domain entity updated
2. EF configuration updated (HasOne, HasForeignKey, HasIndex)
3. Migration generated and reviewed
4. Service/DTOs updated to match
5. Endpoints return new fields
Never store computed values (Balance, SpentAmount, CurrentAmount) as columns.