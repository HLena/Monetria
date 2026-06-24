# Monetria — Estructura del Proyecto

**Última actualización:** 2026-06-04

Monetria es una aplicación de finanzas personales full-stack. Permite gestionar cuentas, transacciones, presupuestos, recurrentes, metas de ahorro, alcancías y deudas.

---

## Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| .NET / ASP.NET Core | 10 | Framework web |
| C# | 13 | Lenguaje del backend |
| Entity Framework Core | 10 | ORM (mapeo objeto-relacional) |
| PostgreSQL | — | Base de datos relacional |
| JWT Bearer | — | Autenticación sin estado |
| BCrypt | — | Hash de contraseñas |
| Swagger / Swashbuckle | 10.1.7 | Documentación de API |

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 6.0.3 | Tipado estático |
| Vite | 6.3.5 | Bundler / dev server |
| React Router | 7.13.0 | Navegación |
| Zustand | 5.0.12 | Estado global |
| React Hook Form | 7.55.0 | Manejo de formularios |
| Tailwind CSS | 4.1.12 | Estilos utilitarios |
| Radix UI | — | Componentes primitivos accesibles |
| Recharts | 2.15.2 | Gráficas y reportes |
| Lucide React | 0.487.0 | Iconos |
| Sonner | 2.0.3 | Notificaciones toast |
| date-fns | 3.6.0 | Utilidades de fechas |
| next-themes | 0.4.6 | Modo oscuro / claro |

---

## Arquitectura General

El proyecto sigue **Clean Architecture** en el backend y una **arquitectura por features** en el frontend.

```
Monetria/
├── backend/
│   ├── Monetria.API/          ← Endpoints HTTP (capa delgada)
│   ├── Monetria.Application/  ← Lógica de negocio, DTOs, interfaces
│   ├── Monetria.Domain/       ← Entidades puras y enums
│   ├── Monetria.Infrastructure/ ← EF Core, repositorios, JWT, BCrypt
│   └── Monetria.Tests/        ← Tests unitarios
└── frontend/
    └── src/
        ├── app/
        │   ├── pages/         ← Una página por ruta
        │   ├── components/    ← Componentes reutilizables y por feature
        │   ├── hooks/         ← Custom hooks para datos
        │   ├── store/         ← Estado global (Zustand)
        │   ├── api/           ← Funciones de llamadas HTTP
        │   ├── mappers/       ← DTO → modelos de UI
        │   └── types/         ← Tipos TypeScript (API y UI)
        ├── lib/               ← Utilidades (apiClient, etc.)
        └── constants/         ← Constantes compartidas
```

---

## Capas del Backend

### 1. `Monetria.Domain` — Dominio puro

Entidades y enums sin dependencias externas.

**Entidades:**

#### `User`
```
Id, FirstName, LastName, Email (único), PasswordHash, CreatedAt
→ Tiene: Accounts, Budgets, Recurrings, SavingsGoals, SavingsPockets, Debts
```

#### `Account`
```
Id, UserId (FK), Name, Type, CurrencyCode (default: PEN)
InitialBalance (decimal, default 0), ColorCode, IsActive, CreatedAt, UpdatedAt
→ Campos opcionales para tarjeta:
  InstitutionName, CardLast4Digits, CreditLimit,
  CardHolderName, StatementClosingDay, PaymentDueDay
→ Saldo NUNCA almacenado — siempre calculado:
  Balance = InitialBalance + SUM(Income) - SUM(Expense)
```

#### `Transaction`
```
Id, FromAccountId (FK), Type, CategoryId (FK nullable)
Amount (decimal 18,2), Description
ToAccountId (FK nullable — solo transferencias)
TransferPairId (Guid nullable — vincula las 2 filas de una transferencia)
IsActive (soft delete), Date (DateOnly), CreatedAt
```

#### `Category`
```
Id, UserId (nullable — null = categoría del sistema)
Name, Type (Income/Expense), IsDefault, IsActive
Color, KeyIcon (nombre de ícono Lucide), CreatedAt, UpdatedAt
```

#### `Budget`
```
Id, UserId (FK), CategoryId (FK real a Category)
LimitAmount, Month (int), Year (int)
RolloverUnused (bool), CreatedAt
Restricción única: (UserId, CategoryId, Month, Year)
```

#### `Recurring` (antes FixedExpense)
```
Id, UserId (FK), AccountId (FK), ToAccountId (FK nullable)
CategoryId (FK nullable), Name
Type (Income/Expense/Transfer)
AmountType (Fixed/Estimated/VariableFree)
Amount (nullable), EstimatedAmount (nullable)
Frequency (Daily/Weekly/Biweekly/Monthly/Yearly)
StartDate, EndDate (nullable), NextDueDate
Notes, IsActive, CreatedAt
```

#### `RecurringOccurrence`
```
Id, RecurringId (FK), ScheduledDate (DateOnly)
Status (Pending/Confirmed/Skipped/AutoRegistered)
SuggestedAmount (nullable), RealAmount (nullable)
TransactionId (FK nullable), ConfirmedAt (nullable)
```

#### `SavingsGoal`
```
Id, UserId (FK), Name
TargetAmount (decimal 18,2, requerido)
CurrentAmount (decimal 18,2)
IsCompleted (bool — true cuando CurrentAmount >= TargetAmount)
LinkedAccountId (Guid?, FK a Account — si presente, CurrentAmount = saldo calculado)
TargetDate (DateOnly?, opcional)
CategoryId (Guid?, FK a Category)
Color (string?)
Description (string?)
IsActive (bool, soft delete)
CreatedAt (DateTime UTC)
```

#### `SavingsPocket`
```
Id, UserId (FK), Name
CurrentAmount (decimal 18,2 — nunca negativo, empieza en 0)
LinkedAccountId (Guid?, FK a Account — set null si se elimina la cuenta)
Color (string?)
Description (string?)
IsActive (bool, soft delete)
CreatedAt (DateTime UTC)
UpdatedAt (DateTime UTC)

SIN: TargetAmount, TargetDate, IsCompleted, CategoryId
```

#### `Debt`
```
Id, UserId (FK), AccountId (FK nullable), CategoryId (FK nullable)
Name, Creditor, OriginalAmount, RemainingAmount
InterestRate (decimal 9,4), MinimumPayment
NextPaymentDate, Type, IsActive, CreatedAt
```

**Enums:**
- `AccountType`: Cash, BankAccount, CreditCard, EWallet
- `TransactionType`: Income, Expense, Transfer
- `RecurringAmountType`: Fixed, Estimated, VariableFree
- `RecurringFrequency`: Daily, Weekly, Biweekly, Monthly, Yearly
- `RecurringOccurrenceStatus`: Pending, Confirmed, Skipped, AutoRegistered

---

### 2. `Monetria.Application` — Lógica de negocio

Servicios, interfaces de repositorios y DTOs. Sin dependencias de infraestructura.

**Patrón por feature:**
```
Application/
├── Accounts/
│   ├── IAccountService.cs / AccountService.cs
│   ├── IAccountRepository.cs
│   ├── IBalanceService.cs / BalanceService.cs
│   └── AccountDtos.cs
├── Auth/
│   ├── IAuthService.cs / AuthService.cs
│   ├── IJwtTokenGenerator.cs / IPasswordService.cs
│   └── AuthDtos.cs
├── Budgets/
├── Categories/
├── Debts/
├── Recurrings/
│   └── RecurringOccurrences/
├── SavingsGoals/
│   ├── ISavingsGoalService.cs / SavingsGoalService.cs
│   ├── ISavingsGoalRepository.cs
│   └── SavingsGoalDtos.cs
├── SavingsPockets/                          ← NUEVO
│   ├── ISavingsPocketService.cs / SavingsPocketService.cs
│   ├── ISavingsPocketRepository.cs
│   └── SavingsPocketDtos.cs
├── Transactions/
├── Users/
└── Common/
    └── IUnitOfWork.cs
```

---

### 3. `Monetria.Infrastructure` — Infraestructura

```
Infrastructure/
├── Persistence/
│   └── MonetriaDbContext.cs        ← DbSets + configuraciones EF Core
├── Accounts/
├── Auth/
├── Budgets/
├── Categories/
├── Debts/
├── Recurrings/
├── SavingsGoals/
├── SavingsPockets/                  ← NUEVO
│   └── SavingsPocketRepository.cs
├── Transactions/
└── Users/
```

**Migraciones aplicadas:**
1. `InitialCreate` — Esquema inicial
2. `AddTransferSupport` — TransferPairId, ToAccountId en Transaction
3. `AddRecurrings` — Tabla Recurrings y RecurringOccurrences
4. `AddSavingsPockets` — Nueva tabla SavingsPockets + columnas a SavingsGoals

---

### 4. `Monetria.API` — Endpoints

Un archivo de endpoints por feature, todos registrados en `Program.cs`.

| Feature | Grupo de rutas |
|---|---|
| Auth | `/auth` |
| Accounts | `/accounts` |
| Transactions | `/transactions` |
| Categories | `/categories` |
| Budgets | `/budgets` |
| Recurrings | `/recurrings` |
| SavingsGoals | `/savings-goals` |
| SavingsPockets | `/savings-pockets` ← NUEVO |
| Debts | `/debts` |

---

## Reglas financieras globales

- Saldo de cuenta = `InitialBalance + SUM(Income) - SUM(Expense)` — nunca almacenado
- Las transferencias nunca afectan presupuestos ni reportes de ingresos/gastos
- Transferencia = siempre 2 filas en una sola `UnitOfWork`, vinculadas por `TransferPairId`
- Presupuesto = `SUM(transactions WHERE CategoryId + Month/Year + Type=Expense)`
- Recurrente `Fixed` → Transaction automática sin confirmación
- Recurrente `Estimated/VariableFree` → `RecurringOccurrence(Pending)`, usuario confirma
- `SavingsGoal` con `LinkedAccountId` → `CurrentAmount` = saldo calculado de esa cuenta
- `SavingsPocket.CurrentAmount` nunca puede ser negativo — validado en servicio
- Pago de deuda → `Transaction(Expense)` + reducir `RemainingAmount`, atómico
- **Nunca borrar datos financieros** — siempre soft delete (`IsActive = false`)
- Montos = `decimal(18,2)` siempre — nunca `float` o `double`
- Tasas de interés = `decimal(9,4)`
- IDs = `Guid`
- Timestamps = `DateTime UTC`
- Fechas de calendario = `DateOnly`

---

## Diferencia SavingsGoal vs SavingsPocket

| | `SavingsGoal` | `SavingsPocket` |
|---|---|---|
| Tiene monto objetivo | ✅ `TargetAmount` | ❌ |
| Tiene fecha límite | ✅ `TargetDate` opcional | ❌ |
| Se marca completada | ✅ `IsCompleted` | ❌ |
| Tiene categoría | ✅ `CategoryId` FK | ❌ |
| Vinculable a cuenta | ✅ | ✅ |
| Depósitos y retiros libres | ❌ solo incremento | ✅ `POST /adjust` |
| Puede quedar en negativo | ❌ | ❌ |
| Soft delete | ✅ | ✅ |
| Calculadora de ahorro | ✅ aplica | ❌ no aplica |

---

## 2026-06-11 — Implementación de SavingsPocket

### Qué se implementó

Feature completo de `SavingsPocket` como entidad independiente de `SavingsGoal`.

**Archivos creados:**

| Capa | Archivo |
|---|---|
| Domain | `Monetria.Domain/Entities/SavingsPocket.cs` |
| Application | `SavingsPockets/SavingsPocketDtos.cs` |
| Application | `SavingsPockets/ISavingsPocketRepository.cs` |
| Application | `SavingsPockets/ISavingsPocketService.cs` |
| Application | `SavingsPockets/SavingsPocketService.cs` |
| Infrastructure | `SavingsPockets/SavingsPocketRepository.cs` |
| API | `Endpoints/SavingsPocketEndpoints.cs` |

**Archivos modificados:**
- `MonetriaDbContext` — nuevo `DbSet<SavingsPocket>` + `ConfigureSavingsPocket()`
- `DependencyInjection` — registro de `ISavingsPocketRepository` y `ISavingsPocketService`
- `Program.cs` — `app.MapSavingsPocketEndpoints()`
- `ApplicationServiceTests.cs` — 6 tests nuevos + 2 fixes de errores preexistentes

**Migración:** `20260611005136_AddSavingsPockets`

### Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/savings-pockets` | Crea una alcancía nueva |
| `GET` | `/savings-pockets` | Lista alcancías activas del usuario |
| `PUT` | `/savings-pockets/{id}` | Actualiza nombre, color, descripción |
| `DELETE` | `/savings-pockets/{id}` | Soft delete |
| `POST` | `/savings-pockets/{id}/adjust` | Deposita o retira |

### Reglas de negocio

- `CurrentAmount` **siempre se crea en 0** — cualquier valor en el request es ignorado
- `AdjustAmountAsync`: `Amount > 0` = depósito, `Amount < 0` = retiro
- Retiro rechazado si `CurrentAmount + Amount < 0` → `ArgumentException`
- `Amount == 0` rechazado → `ArgumentException`
- `UpdatedAt` se actualiza en create, update y adjust
- Soft delete: `IsActive = false`, nunca borrado físico
- `LinkedAccountId` usa `OnDelete(SetNull)` — si se borra la cuenta, el pocket queda sin vincular

### Tests añadidos (6)

1. `CreateSavingsPocketAsync_CurrentAmountAlwaysStartsAtZero`
2. `AdjustAmountAsync_Deposit_IncreasesAmount`
3. `AdjustAmountAsync_Withdrawal_DecreasesAmount`
4. `AdjustAmountAsync_WithdrawMoreThanBalance_ThrowsArgumentException`
5. `AdjustAmountAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException`
6. `DeleteSavingsPocketAsync_SetsIsActiveFalse_DoesNotPhysicallyDelete`

Todos pasan (6/6). También se corrigieron 2 errores preexistentes en `GatedTransactionRepository` y `ListTransactionsAsync_DoesNotReturnDeletedTransactions`.
## 2026-06-10 — Fix SavingsGoal soft delete + tests

### Problema

`SavingsGoal` no tenía el campo `IsActive` aunque el repositorio lo usaba para filtrar. Esto causaba un error de compilación. Adicionalmente, `DeleteAsync` hacía hard delete (`dbContext.Remove`), contradiciendo la regla universal de soft delete.

### Fix aplicado

- `SavingsGoal.cs` — agregado `bool IsActive { get; set; } = true`
- `MonetriaDbContext.cs` — configurado `IsActive` con `HasDefaultValue(true)`
- `SavingsGoalService.DeleteAsync` — cambiado a `savingsGoal.IsActive = false`
- `ISavingsGoalRepository` + `SavingsGoalRepository` — eliminado método `Remove`
- Migración: `AddSavingsGoalIsActive`

### Tests agregados (SavingsGoals)

1. `CreateSavingsGoalAsync_WithValidRequest_Succeeds`
2. `CreateSavingsGoalAsync_WithZeroTargetAmount_ThrowsArgumentException`
3. `CreateSavingsGoalAsync_WhenCurrentAmountMeetsTarget_IsCompleted`
4. `ListSavingsGoalsAsync_ExcludesDeletedByDefault`

## 2026-06-23 — Refactor: extracción de componentes y simplificación de página

### Qué se cambió
- `SavingsGoalForm` extraído a `components/savings/SavingsGoalForm.tsx`
- `AddToGoalModal` extraído a `components/savings/AddToGoalModal.tsx`
- `SavingsCalculator` extraído a `components/savings/SavingsCalculator.tsx`
  - Ahora soporta dark mode correctamente
  - Corrección menor: se simplificó la condición `!currentNum && currentNum !== 0` a simplemente `!targetNum`
- `pages/Savings.tsx` usa `SummaryCard` (variantes `indigo`, `emerald`, `purple`) y `EmptyState`
- Helpers `daysUntil` y `monthsUntil` movidos al scope del módulo
