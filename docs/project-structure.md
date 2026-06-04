# Monetria — Estructura del Proyecto

**Última actualización:** 2026-05-28

Monetria es una aplicación de finanzas personales full-stack. Permite gestionar cuentas, transacciones, presupuestos, gastos fijos, metas de ahorro y deudas.

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
→ Tiene: Accounts (1:N)
```

#### `Account`
```
Id, UserId (FK), Name, Type, CurrencyCode (default: PEN)
ColorCode, IsActive, CreatedAt, UpdatedAt
→ Campos de tarjeta de crédito (opcionales):
  InstitutionName, CardLast4Digits, CreditLimit,
  CardHolderName, StatementClosingDay, PaymentDueDay
→ Tiene: Transactions (1:N)
```

#### `Transaction`
```
Id, FromAccountId (FK), Type, CategoryId (FK nullable)
Amount, Description, ToAccountId (FK nullable, para transferencias)
IsActive (soft delete), Date, CreatedAt
```

#### `Category`
```
Id, UserId (nullable — null = categoría por defecto del sistema)
Name, Type (Income/Expense), IsDefault, IsActive
Color, KeyIcon (nombre de ícono Lucide), CreatedAt, UpdatedAt
```

#### `Budget`
```
Id, UserId (FK), CategoryId (FK → Category), LimitAmount, Month (int), Year (int), RolloverUnused, CreatedAt
SpentAmount = calculated (never stored)
Unique: (UserId, CategoryId, Month, Year)
```

#### `Debt`
```
Id, UserId (FK), AccountId (FK nullable), CategoryId (FK nullable)
Name, Creditor, OriginalAmount, RemainingAmount
InterestRate, MinimumPayment, NextPaymentDate, Type, IsActive
```

#### `Recurring` (renamed from FixedExpense)
```
Id, UserId (FK), AccountId (FK), ToAccountId (FK nullable), CategoryId (FK nullable)
Name, Type, AmountType (Fixed/Estimated/VariableFree), Amount (nullable), EstimatedAmount (nullable)
Frequency, StartDate, EndDate (nullable), NextDueDate, IsActive
```

#### `RecurringOccurrence`
```
Id, RecurringId (FK), ScheduledDate, Status (Pending/Confirmed/Skipped/AutoRegistered)
SuggestedAmount, RealAmount, TransactionId (nullable), ConfirmedAt
```

#### `SavingsGoal`
```
Id, UserId (FK), Name, TargetAmount, CurrentAmount
LinkedAccountId (FK nullable → Account), IsCompleted
TargetDate, Category, Color, Description
```

**Enums:**
- `AccountType`: Cash (1), BankAccount (2), CreditCard (3), EWallet (4)
- `TransactionType`: Income, Expense, Transfer
- `BudgetPeriod`: Monthly, Weekly
- `ExpensePeriod`: Monthly, Weekly, Yearly

---

### 2. `Monetria.Application` — Lógica de negocio

Servicios, interfaces de repositorios y DTOs. Sin dependencias de infraestructura.

**Patrón por dominio:**
```
Application/
├── Accounts/
│   ├── IAccountService.cs / AccountService.cs
│   ├── IAccountRepository.cs
│   ├── IBalanceService.cs / BalanceService.cs
│   └── AccountDtos.cs          ← CreateAccountRequest, UpdateAccountRequest,
│                                   AccountSummaryResponse, AccountDetailResponse
├── Auth/
│   ├── IAuthService.cs / AuthService.cs
│   ├── IJwtTokenGenerator.cs
│   ├── IPasswordService.cs
│   └── AuthDtos.cs             ← RegisterRequest, LoginRequest, AuthResponse
├── [Budgets / Categories / Debts / FixedExpenses / SavingsGoals / Transactions / Users]
│   └── (mismo patrón)
└── Common/
    └── IUnitOfWork.cs
```

---

### 3. `Monetria.Infrastructure` — Infraestructura

Implementaciones concretas de repositorios, acceso a base de datos y auth.

- **`MonetriaDbContext.cs`**: DbContext de EF Core con todas las entidades
- **`JwtTokenGenerator.cs`**: Generación de tokens JWT
- **`PasswordService.cs`**: Hash/verificación de contraseñas (BCrypt)
- **Repositorios**: Un repositorio EF Core por entidad

**Migraciones aplicadas:**
1. `20260429162409_InitialCreate` — Esquema inicial
2. `20260513210732_RenameAccountCreditColumns` — Renombramiento de columnas
3. `20260518205207_AddTransactionTransferAndSoftDelete` — Tipo Transfer + soft delete
4. `20260520210924_AddCategoryKeyIconAndReseedCategories` — Campo icon + categorías por defecto
5. `20260522040601_RenameTransactionAccountIdFields` — `FromAccountId` / `ToAccountId`
6. `20260522041029_RemoveAccountInitialBalanceAndProviderName` — Limpieza de columnas

---

### 4. `Monetria.API` — Endpoints HTTP (Minimal APIs)

Capa delgada. Cada grupo de endpoints delega en el servicio de aplicación correspondiente.

#### Endpoints disponibles

| Grupo | Método | Ruta | Auth |
|---|---|---|---|
| Auth | POST | `/auth/register` | No |
| Auth | POST | `/auth/login` | No |
| Users | GET | `/users/{id}` | JWT |
| Accounts | POST | `/accounts` | JWT |
| Accounts | GET | `/accounts` | JWT |
| Accounts | GET | `/accounts/{id}` | JWT |
| Accounts | PUT | `/accounts/{id}` | JWT |
| Accounts | DELETE | `/accounts/{id}` | JWT |
| Accounts | GET | `/accounts/balance/summary` | JWT |
| Transactions | POST | `/transactions` | JWT |
| Transactions | GET | `/transactions` | JWT |
| Transactions | GET | `/transactions/{id}` | JWT |
| Transactions | PUT | `/transactions/{id}` | JWT |
| Transactions | DELETE | `/transactions/{id}` | JWT |
| Transactions | GET | `/accounts/{accountId}/transactions` | JWT |
| Categories | POST | `/categories` | JWT |
| Categories | GET | `/categories` | JWT |
| Categories | PATCH | `/categories/{id}` | JWT |
| Categories | PATCH | `/categories/{id}/deactivate` | JWT |
| Budgets | POST | `/budgets` | JWT |
| Budgets | GET | `/budgets` | JWT |
| Budgets | PUT | `/budgets/{id}` | JWT |
| Budgets | DELETE | `/budgets/{id}` | JWT |
| Debts | POST | `/debts` | JWT |
| Debts | GET | `/debts` | JWT |
| Debts | PUT | `/debts/{id}` | JWT |
| Debts | DELETE | `/debts/{id}` | JWT |
| Debts | POST | `/debts/{id}/pay` | JWT |
| Recurrings | POST | `/recurrings` | JWT |
| Recurrings | GET | `/recurrings` | JWT |
| Recurrings | PUT | `/recurrings/{id}` | JWT |
| Recurrings | PATCH | `/recurrings/{id}/deactivate` | JWT |
| SavingsGoals | POST | `/savings-goals` | JWT |
| SavingsGoals | GET | `/savings-goals` | JWT |
| SavingsGoals | PUT | `/savings-goals/{id}` | JWT |
| SavingsGoals | DELETE | `/savings-goals/{id}` | JWT |

---

## Frontend

### Páginas (Rutas)

| Página | Ruta | Descripción |
|---|---|---|
| `Login.tsx` | `/login` | Registro e inicio de sesión |
| `Dashboard.tsx` | `/` | Resumen con balance, transacciones recientes |
| `Accounts.tsx` | `/accounts` | Lista de cuentas + crear |
| `AccountDetail.tsx` | `/accounts/:id` | Detalle de cuenta + sus transacciones |
| `Transactions.tsx` | `/transactions` | Todas las transacciones con filtros |
| `Budgets.tsx` | `/budgets` | Gestión de presupuestos |
| `FixedExpenses.tsx` | `/fixed-expenses` | Gastos fijos periódicos |
| `Savings.tsx` | `/savings` | Metas de ahorro |
| `DebtPlanning.tsx` | `/debts` | Planificación de deudas |
| `Reports.tsx` | `/reports` | Reportes y gráficas |

### Componentes Compartidos (`src/app/components/shared/`)

- `HeaderPage` — Encabezado estándar de página (título, subtítulo, acciones)
- `PageContainer` — Wrapper de contenido con paddings
- `EmptyState` — Mensaje de estado vacío con ícono
- `ErrorBanner` — Alerta de error
- `LoadingState` — Spinner de carga

### Hooks Personalizados (`src/app/hooks/`)

```typescript
useAccounts()        // Carga todas las cuentas al montar
useTransactions()    // Carga transacciones, cuentas y categorías al montar
useAccount(id)       // Carga una sola cuenta por ID
```

### Estado Global (Zustand, `src/app/store/`)

- **`AuthStore`** — Usuario autenticado, token JWT, login/logout/register
- **`FinanceStore`** — Cuentas, transacciones, categorías, presupuestos, metas, deudas, balance

### Cliente HTTP (`src/lib/apiClient.ts`)

Centraliza las llamadas HTTP e inyecta automáticamente el header `Authorization: Bearer <token>` en todas las peticiones autenticadas.

### Mappers (`src/app/mappers/`)

Transforman los DTOs de la API en modelos de UI:
- `accountMappers.ts` — `AccountSummaryDto` / `AccountDetailDto` → `Account` (UI)
- `transactionMappers.ts` — `TransactionDto` → `Transaction` (UI)

### Tipos TypeScript (`src/app/types/`)

```
types/
├── api/          ← Tipos de respuesta de la API (DTOs)
│   ├── accounts.ts       AccountSummaryDto, AccountDetailDto, UserBalanceDto
│   ├── transactions.ts   TransactionDto, CreateTransactionRequestBody
│   └── categories.ts     CategoryDto
├── models/       ← Modelos del frontend (UI)
│   └── account.ts
└── enums/        ← Enums de UI (AccountType)
```

---

## Patrones Clave

| Patrón | Dónde | Por qué |
|---|---|---|
| Clean Architecture | Backend | Separación de responsabilidades, testabilidad |
| Repository + Unit of Work | Backend | Abstracción de acceso a datos, transacciones |
| DTO | Backend | Desacopla contratos HTTP de entidades de dominio |
| Soft Delete | Transactions, Categories | Preservar historial sin borrado físico |
| JWT stateless | Auth | Escalabilidad, sin sesiones en servidor |
| Custom Hooks | Frontend | Encapsulan lógica de datos y estados async |
| Mapper Layer | Frontend | Desacopla tipos de API de modelos de UI |
| Minimal APIs | Backend | Endpoints concisos sin Controllers |

---

## Base de Datos — Relaciones Principales

```
User ──< Account ──< Transaction >── Category
                 └──< FixedExpense
User ──< Budget
User ──< Debt
User ──< SavingsGoal
Transaction.ToAccountId ──> Account   (solo en transferencias)
```

**Precisión monetaria:** `decimal(18, 2)` para montos; `decimal(9, 4)` para tasas de interés.

## Monorepo Structure (updated 2026-05-30)
- Restructured to Turborepo monorepo
- apps/web ← React frontend
- apps/api ← .NET backend
- packages/enums ← @monetria/enums shared package

## Completed Changes
- [x] Monorepo setup with Turborepo + npm workspaces
- [x] @monetria/enums package extracted
- [x] InitialBalance restored to Account entity
- [x] BalanceService updated to include InitialBalance

## Pending Changes (in order)
- [x] Fix transfers — 2 atomic Transaction rows with TransferPairId
- [x] Rename FixedExpense → Recurring + RecurringOccurrence entity
- [x] Fix Budget — CategoryId FK + Month/Year + calculated SpentAmount
- [x] Fix SavingsGoal — LinkedAccountId + IsCompleted
- [x] Fix Debt — AccountId + CategoryId + POST /debts/{id}/pay
- [ ] GET /dashboard endpoint
- [ ] Pagination for GET /transactions
- [ ] orval setup in packages/types
- [ ] apps/mobile with Expo
