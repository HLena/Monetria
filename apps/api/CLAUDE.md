# Backend Rules

## Architecture

```
Monetria.API          ← endpoints delgados, sin lógica
Monetria.Application  ← servicios, DTOs, interfaces de repositorios
Monetria.Domain       ← entidades puras, enums, sin dependencias externas
Monetria.Infrastructure ← EF Core, repositorios, JWT, BCrypt
```

Rules:
- API must stay thin — no business logic
- Business logic belongs in Application
- Domain must stay pure — no framework dependencies
- Infrastructure cannot contain business logic

---

## Feature Organization

Each feature lives in its own folder across all layers:

```
Application/
└── FeatureName/
    ├── IFeatureService.cs
    ├── FeatureService.cs
    ├── IFeatureRepository.cs
    └── FeatureDtos.cs       ← sealed records only

Infrastructure/
└── FeatureName/
    └── FeatureRepository.cs

API/Endpoints/
└── FeatureEndpoints.cs      ← MapGroup + RequireAuthorization
```

---

## Coding Conventions

- DTOs as `sealed record` in `Application/<Feature>/<Feature>Dtos.cs`
- One service per feature — interface + implementation
- Services validate ownership: always check `entity.UserId == userId`
- Throw `NotFoundException` when entity not found
- Throw `UnauthorizedAccessException` when user doesn't own the resource
- All timestamps: `DateTime.UtcNow`
- All IDs: `Guid.NewGuid()`
- Soft delete: set `IsActive = false`, never call `dbContext.Remove()` on financial data
- Migrations always run from monorepo root:
  ```
  dotnet ef migrations add <Name> \
    --project apps/api/Monetria.Infrastructure \
    --startup-project apps/api/Monetria.API
  ```

---

## Financial Rules (enforce in services)

- Amounts: `decimal(18,2)` — never `float` or `double`
- Interest rates: `decimal(9,4)`
- Account balance is NEVER stored — always calculated: `InitialBalance + SUM(Income) - SUM(Expense)`
- Transfer = always 2 rows in one `UnitOfWork`, linked by `TransferPairId`
- Transfers do NOT affect budgets or income/expense reports
- `SavingsPocket.CurrentAmount` must never go below 0 — validate in `AdjustAmountAsync`

---

## Savings Module

Two separate entities, two separate features. Never merge them.

### `SavingsGoal` — has a target
- `TargetAmount`: required, > 0
- `TargetDate`: `DateOnly?`
- `IsCompleted`: `true` when `CurrentAmount >= TargetAmount`
- `LinkedAccountId`: optional FK to Account — when present, `CurrentAmount` is calculated from that account's balance
- `CategoryId`: real FK to `Category` — never string
- `IsActive`: soft delete

### `SavingsPocket` — open-ended piggy bank
- NO `TargetAmount`, NO `TargetDate`, NO `IsCompleted`, NO `CategoryId`
- `CurrentAmount` starts at 0, never goes negative
- Adjust endpoint: `POST /savings-pockets/{id}/adjust`
  - `Amount > 0` = deposit
  - `Amount < 0` = withdrawal
  - Validation: `pocket.CurrentAmount + request.Amount >= 0`
- `IsActive`: soft delete
- `UpdatedAt` updated on every write operation

---

## Testing

All business logic changes require tests.

Required tests per service method:
- Happy path
- Not found (NotFoundException)
- Wrong user (UnauthorizedAccessException)
- Invalid input (ArgumentException)

For SavingsPocket specifically:
- `AdjustAmountAsync_Deposit_IncreasesAmount`
- `AdjustAmountAsync_Withdrawal_DecreasesAmount`
- `AdjustAmountAsync_WithdrawMoreThanBalance_ThrowsArgumentException`
- `AdjustAmountAsync_WhenBelongsToAnotherUser_ThrowsUnauthorized`
- `DeleteAsync_SetIsActiveFalse_DoesNotPhysicallyDelete`