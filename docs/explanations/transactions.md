# Transactions — Implementation Log

## Update: 2026-06-02

### Rename FixedExpense → Recurring + RecurringOccurrence entity

**Motivation:** The original `FixedExpense` only modeled fixed monthly expenses. The new `Recurring` entity covers income, expenses, and transfers across any frequency, with three amount modes and an occurrence tracking model.

**Domain — deleted**
- `Domain/Entities/FixedExpense.cs`
- `Domain/Enums/ExpensePeriod.cs`

**Domain — created**
- `Domain/Entities/Recurring.cs`: `Id, UserId, AccountId, ToAccountId?, CategoryId?, Name, Type (TransactionType), AmountType (RecurringAmountType), Amount?, EstimatedAmount?, Frequency (RecurringFrequency), StartDate (DateOnly), EndDate? (DateOnly), NextDueDate (DateOnly), IsActive`
- `Domain/Entities/RecurringOccurrence.cs`: `Id, RecurringId (FK), ScheduledDate (DateOnly), Status (RecurringOccurrenceStatus), SuggestedAmount?, RealAmount?, TransactionId?, ConfirmedAt?`
- `Domain/Enums/RecurringFrequency.cs`: `Daily, Weekly, Biweekly, Monthly, Yearly`
- `Domain/Enums/RecurringAmountType.cs`: `Fixed, Estimated, VariableFree`
- `Domain/Enums/RecurringOccurrenceStatus.cs`: `Pending, Confirmed, Skipped, AutoRegistered`

**Application — deleted** `Application/FixedExpenses/`

**Application — created** `Application/Recurrings/`
- `RecurringDtos.cs`: `CreateRecurringRequest`, `UpdateRecurringRequest`, `RecurringResponse`
- `IRecurringRepository.cs`, `IRecurringService.cs`, `RecurringService.cs`
- Amount validation by AmountType: Fixed requires `Amount > 0`; Estimated requires `EstimatedAmount > 0`; VariableFree requires neither

**Infrastructure — deleted** `Infrastructure/FixedExpenses/`

**Infrastructure — created** `Infrastructure/Recurrings/RecurringRepository.cs`
- Includes `Category` navigation on all queries
- Orders by `NextDueDate, Name`

**Infrastructure — modified**
- `MonetriaDbContext.cs`: replaced `DbSet<FixedExpense>` with `DbSet<Recurring>` + `DbSet<RecurringOccurrence>`; replaced `ConfigureFixedExpense` with `ConfigureRecurring` + `ConfigureRecurringOccurrence`
- `DependencyInjection.cs`: `IFixedExpenseRepository/Service` → `IRecurringRepository/Service`

**API — deleted** `API/Endpoints/FixedExpenseEndpoints.cs`

**API — created** `API/Endpoints/RecurringEndpoints.cs`
- `POST   /recurrings`
- `GET    /recurrings?includeInactive=bool`
- `PUT    /recurrings/{id}`
- `PATCH  /recurrings/{id}/deactivate`

**Migration** `RenameFixedExpenseToRecurring`: drops `FixedExpenses`, creates `Recurrings` and `RecurringOccurrences` tables.

---

## Update: 2026-05-31

### Fix transfers — 2 atomic Transaction rows with TransferPairId

**Problem:** Transfer created one row with `ToAccountId` set; balance was computed by a special query that also joined on `ToAccountId`. This violated the domain rule and added query complexity.

**New design:** A transfer from Account A → B creates two rows sharing a `TransferPairId`:
- Row 1 (outflow): `FromAccountId=A, ToAccountId=B, TransferPairId=pairId` — subtracts from A
- Row 2 (inflow): `FromAccountId=B, ToAccountId=null, TransferPairId=pairId` — adds to B

Direction is encoded by `ToAccountId` presence on the outflow row; no new enum or flag needed.

**Backend**

- `Transaction.cs`: added `Guid? TransferPairId`
- `TransactionDtos.cs`: `TransactionResponse` includes `Guid? TransferPairId`
- `ITransactionRepository.cs`: added `GetTransferPairAsync(transactionId, transferPairId)`
- `TransactionService.cs`:
  - `CreateAsync`: when Type=Transfer, creates both rows atomically in one `SaveChanges`; returns outflow row
  - `DeleteAsync`: soft-deletes both rows when deleting a Transfer
  - `MapToResponse`: exposes `TransferPairId`
- `TransactionRepository.cs`:
  - `GetAccountBalanceDeltaAsync`: simplified — queries only `WHERE FromAccountId = accountId`; direction from `ToAccountId` presence (null = inflow = add, set = outflow = subtract)
  - Added `GetTransferPairAsync`
- Migration `AddTransferPairId`: adds `TransferPairId uuid nullable` column; data migration CTE converts existing single-row transfers into 2-row pairs atomically

---

## Update: 2026-05-21

### Balance actual de cuentas calculado desde transacciones

**Backend**

- `AccountDtos.cs`: `AccountResponse` incluye nuevo campo `CurrentBalance`
- `AccountService.cs`: inyecta `ITransactionRepository`; `ListByUserIdAsync` computa `CurrentBalance = InitialBalance + delta` para todas las cuentas en paralelo (`Task.WhenAll`); `UpdateAsync` y `CreateAsync` también calculan y devuelven `CurrentBalance`; `MapToResponse` recibe `currentBalance` como parámetro
- `ApplicationServiceTests.cs`: instanciación de `AccountService` actualizada con el nuevo parámetro `TransactionRepository`

**Frontend**

- `types/api/accounts.ts`: `AccountDto` incluye `currentBalance: number`
- `mappers/accountMappers.ts`: `initialBalance` en el modelo `Account` se mapea desde `dto.currentBalance` (no desde `dto.initialBalance`) — todo el código que muestra `account.initialBalance` ahora muestra el balance real con transacciones
- `mappers/transactionMappers.ts`: fechas enviadas al backend con sufijo `Z` (`T00:00:00Z`) para que .NET las parse como `DateTimeKind.Utc`, requerido por Npgsql
- `TransactionForm.tsx`: `useEffect` sincroniza `accountId` cuando `accounts` llegan después del montaje

---

## Update: 2026-05-20

### KeyIcon en categorías, fix bugs backend, categorías desde API en TransactionForm

**Backend**

- `Category.cs`: nuevo campo `string? KeyIcon`
- `CategoryDtos.cs`: `KeyIcon?` agregado a `CreateCategoryRequest`, `UpdateCategoryRequest` y `CategoryResponse`
- `CategoryService.cs`: `NormalizeKeyIcon`, propagado en Create, Update y `MapToResponse`
- `MonetriaDbContext.cs`: `KeyIcon` configurado (`HasMaxLength(60)`); `DefaultCategories` reemplazado con 18 categorías activas (12 Expense + 6 Income) con colores e íconos correctos; 3 categorías obsoletas (Vivienda, Ahorro, Ingresos) marcadas `isActive: false` para preservar FK
- Migración `AddCategoryKeyIconAndReseedCategories`: ADD COLUMN `key_icon`; UPDATE categorías existentes; DEACTIVATE Vivienda/Ahorro/Ingresos; INSERT 11 nuevas (Servicios, Tecnología, Ropa, Hogar, Viajes, Restaurantes, Salario, Freelance, Inversiones, Ventas, Bonos)
- `TransactionDtos.cs`: `TransactionResponse` incluye `CategoryKeyIcon`
- `TransactionService.cs`: `MapToResponse` expone `Category?.KeyIcon`; eliminada guarda duplicada de `categoryId` que también aplicaba a Income (ahora solo a Expense)
- `TransactionRepository.cs`: `GetByIdAsync` ahora filtra `IsActive = true` — corrige bug donde `GET /transactions/{id}` devolvía transacciones soft-deleted
- `ApplicationServiceTests.cs`: +6 tests (GetById owner, GetById otro user, Update válido, Update otro user, Delete otro user, List no devuelve eliminados) → total 29 tests

**Frontend**

- `types/api/categories.ts`: `keyIcon: string | null` en `CategoryDto`
- `types/api/transactions.ts`: `categoryKeyIcon: string | null` en `TransactionDto`
- `types/finance.ts`: `categoryColor?` y `categoryKeyIcon?` en `Transaction`
- `mappers/transactionMappers.ts`: mapea `categoryColor` y `categoryKeyIcon` del DTO
- `lib/categoryIcons.tsx`: eliminado `CATEGORY_COLORS`; nuevo `ICON_MAP` (iconKey → LucideIcon); nuevo `CATEGORY_NAME_TO_KEY` para compatibilidad con páginas que pasan nombre de categoría; `getCategoryIcon(iconKey)` reemplaza `getCategoryIcon(category)`; `CategoryIconCircle` acepta `iconKey`, `category` (fallback), `color`
- `components/transactions/TransactionRow.tsx`: usa `iconKey={tx.categoryKeyIcon}` y `color={tx.categoryColor}`
- `components/transactions/TransactionForm.tsx`: categorías obtenidas del store (`categories` filtradas por tipo Expense/Income); `CategoryIconCircle` recibe `iconKey` y `color` del backend; toggle de tipo deshabilitado en edit mode (`isEditMode`); race condition de cuentas: muestra "Cargando cuentas…" si `accounts.length === 0`
- `store/FinanceStore.tsx`: eliminado `console.log`; `addTransaction` y `deleteTransaction` llaman `loadAccounts` tras éxito para refrescar balances

## Update: 2026-05-19 (2)

### Componentes reutilizables

**Archivos nuevos**

- `components/ui/SummaryCard.tsx`: tarjeta de resumen con prop `colorVariant` ('emerald' | 'rose' | 'indigo') y `valueClassName` opcional para override de color del valor (usado en Balance con color dinámico)
- `components/ui/FilterSelect.tsx`: wrapper de `<select>` con el estilo consistente del proyecto; acepta todos los props nativos del select
- `components/ui/FilterInput.tsx`: wrapper de `<input>` con soporte de ícono izquierdo vía prop `icon: ReactNode`; ajusta el padding automáticamente según si hay ícono
- `components/transactions/TransactionRow.tsx`: fila de transacción extraída del `map` en `Transactions.tsx`; recibe `transaction`, `account`, `onEdit`, `onDelete`

**Archivos modificados**

- `Transactions.tsx`: reemplaza los 3 divs de Summary por `<SummaryCard>`, los 4 selects por `<FilterSelect>`, el input de búsqueda por `<FilterInput>`, y el JSX del `map` por `<TransactionRow>`; el componente quedó ~80 líneas más corto

---

## Update: 2026-05-19

### Integración frontend con la API

**Archivos nuevos**

- `types/api/transactions.ts`: DTOs `TransactionDto`, `CreateTransactionRequestBody`, `UpdateTransactionRequestBody` y el tipo `TransactionTypeDto` ('Income' | 'Expense' | 'Transfer')
- `types/api/categories.ts`: DTO `CategoryDto` para resolver nombre → UUID al crear/actualizar
- `api/transactions.ts`: funciones `listTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction`
- `api/categories.ts`: función `listCategories`
- `mappers/transactionMappers.ts`: `mapTransactionDtoToTransaction` (DTO → modelo), `toCreateTransactionRequestBody`, `toUpdateTransactionRequestBody`; mapeo de TransactionType ('Income'↔'income'), extracción de fecha ISO, resolución de categoryId por nombre

**Archivos modificados**

- `types/finance.ts`: agregado `categoryId?: string` a la interfaz `Transaction` para portar el UUID del backend
- `types/api/index.ts`: re-exporta los nuevos tipos de transacciones y categorías
- `FinanceStore.tsx`: agregado `categories: CategoryDto[]`, `loadCategories`, `loadTransactions`, `addTransaction`, `updateTransaction`, `deleteTransaction`; `transactions` eliminado del `partialize` (ya no se persiste en localStorage, siempre viene de la API); merge excluye `accounts`, `transactions`, `categories`
- `Transactions.tsx`: `useEffect` para cargar categorías y transacciones al montar (mismo patrón que `Accounts.tsx` con `onFinishHydration`); error banner con botón de cierre; `TransactionForm.onSave` ahora es async con estado `isSubmitting`; botón eliminar con `confirm()` conectado al store; modales de crear y editar conectados a `addTransaction` / `updateTransaction`

**Decisiones de diseño**

- El form sigue mostrando nombres de categoría en español (EXPENSE_CATEGORIES / INCOME_CATEGORIES); la resolución del UUID ocurre en el mapper usando la lista cargada de la API
- `loadCategories` no propaga error (non-critical): si falla, el categoryId queda null y la transacción fallará en el backend solo si es expense sin categoría
- Las transferencias siempre envían `categoryId: null` ya que el backend las valida sin categoría

---

## Update: 2026-05-18

### Cambios implementados

**Backend**

- `TransactionType` enum: se agregó el valor `Transfer`
- `Transaction.cs`: `CategoryId` pasó de `Guid` a `Guid?` (nullable); se agregaron `Guid? TransferAccountId` y `bool IsActive = true`; se eliminó el método `Validate()` (la validación vive en el servicio)
- `TransactionDtos.cs`: `CreateTransactionRequest` ahora recibe `Guid? CategoryId` y `Guid? TransferAccountId`; `TransactionResponse` incluye `TransferAccountId` e `IsActive`; se agregó el record `UpdateTransactionRequest` con los campos editables (Amount, CategoryId, TransactionDate, Description, AccountId)
- `ITransactionRepository`: se agregó `GetByIdAsync`
- `TransactionRepository`: `GetAccountBalanceDeltaAsync` ahora descuenta el monto de la cuenta origen en transferencias y lo suma en la cuenta destino; todas las queries filtran `IsActive = true`; se implementó `GetByIdAsync`
- `ITransactionService`: se agregaron `GetByIdAsync`, `UpdateAsync`, `DeleteAsync`
- `TransactionService`: `CreateAsync` maneja el tipo Transfer (no requiere categoría, requiere `transferAccountId`, valida propiedad de ambas cuentas); se implementaron `GetByIdAsync`, `UpdateAsync`, `DeleteAsync` (soft delete poniendo `IsActive = false`)
- `MonetriaDbContext`: se configuró `TransferAccountId` como FK nullable a `Accounts` con delete Restrict; `CategoryId` marcado como `IsRequired(false)`
- `TransactionEndpoints`: se agregaron `GET /transactions/{id}`, `PUT /transactions/{id}`, `DELETE /transactions/{id}` (204)
- EF Migration `AddTransactionTransferAndSoftDelete`: agrega columnas `TransferAccountId` e `IsActive`
- Tests: se agregaron 7 nuevos tests (create expense, create income, amount negativo, categoría inactiva, transfer sin transferAccountId, transfer válida, soft delete); total 16 tests pasando

**Frontend**

- `finance.ts`: `TransactionType` ahora incluye `'transfer'`; `Transaction` interface incluye `transferAccountId?: string`
- `Transactions.tsx`: tercer botón "Transferencia" en el toggle del form; selector de cuenta destino (filtra la cuenta origen); descripción ya no es required; render de fila muestra color índigo y símbolo ⇄ para transferencias; filtro de tipo incluye opción "Transferencias"

---

## Plan original: 2026-05-14

---

## Current State

### Backend — Partial
- Entity `Transaction`, enum `TransactionType` (Income, Expense) — **missing Transfer**
- `TransactionService`: Create, ListByUser, ListByAccount
- `TransactionRepository`: Add, GetBalanceDelta, ListByUser, ListByAccount (with filters)
- Endpoints: `POST /transactions`, `GET /transactions`, `GET /accounts/{id}/transactions`
- Migrations: Transactions table + 11 default categories seeded
- Tests: 4 (unauthorized, category mismatch, credit limit, category link)
- **Missing fields in entity**: `transferAccountId`, `isActive`
- **Missing endpoints**: GET /{id}, PUT /{id}, DELETE /{id}
- **Missing service methods**: GetById, Update, Delete

### Frontend — UI complete, zero API integration
- `Transactions.tsx`: full UI (form, filters, list, summary) — all handlers are stubs
- `FinanceStore.tsx`: `addTransaction`, `deleteTransaction`, `loadTransactions` declared but empty
- No API client for transactions, no DTO types, no mapper
- **Missing**: Transfer type in form and type enum

---

## Rules (from spec)

- Amount always positive, never store negative values
- Belongs to authenticated user
- Financial impact determined by `type`
- **Immutable fields**: `userId`, `createdAt`, `type`
- **Editable fields**: Amount, CategoryId, Date, Description, AccountId
- Soft delete: `isActive = false` means deleted, `isActive = true` means active
- `categoryId` required for Expense only
- `transferAccountId` required when type is Transfer

---

## What Needs to Be Built

### Backend

**1. Entity changes — `Transaction.cs`**
- Add `Guid? TransferAccountId`
- Add `bool IsActive = true`

**2. Enum change — `TransactionType.cs`**
- Add `Transfer` value

**3. New migration**
- Add `TransferAccountId` column (nullable Guid, FK to Accounts — restrict delete)
- Add `IsActive` column (bool, default true)

**4. DTOs — `TransactionDtos.cs`**
- `CreateTransactionRequest`: add `Guid? TransferAccountId`
- `TransactionResponse`: add `Guid? TransferAccountId`, `bool IsActive`
- New `UpdateTransactionRequest`: Amount, Guid? CategoryId, DateTime Date, string Description, Guid AccountId

**5. Repository — `ITransactionRepository` + `TransactionRepository`**
- Add `GetByIdAsync(Guid id)` — includes Category, filters `isActive = true`
- Add `UpdateAsync(Transaction)`
- Modify list queries to filter `isActive = true`

**6. Service — `ITransactionService` + `TransactionService`**
- Add `GetByIdAsync(Guid userId, Guid transactionId)` — ownership check
- Add `UpdateAsync(Guid userId, Guid transactionId, UpdateTransactionRequest)` — only editable fields, validate category/amount
- Add `DeleteAsync(Guid userId, Guid transactionId)` — soft delete (`isActive = false`)
- Update `CreateAsync` — add Transfer validation (transferAccountId required, ownership of destination account)
- Update list methods — rely on repo filter for isActive

**7. Endpoints — `TransactionEndpoints.cs`**
- Add `GET /{id:guid}`
- Add `PUT /{id:guid}`
- Add `DELETE /{id:guid}` → 204 NoContent

**8. Tests (required by backend/CLAUDE.md)**
- `GetTransactionAsync_WhenBelongsToUser_ReturnsResponse`
- `GetTransactionAsync_WhenBelongsToAnotherUser_ThrowsUnauthorized`
- `UpdateTransactionAsync_WithValidFields_UpdatesCorrectly`
- `UpdateTransactionAsync_WhenBelongsToAnotherUser_ThrowsUnauthorized`
- `DeleteTransactionAsync_SetsIsActiveFalse`
- `DeleteTransactionAsync_WhenBelongsToAnotherUser_ThrowsUnauthorized`
- `CreateTransactionAsync_Transfer_RequiresTransferAccountId`
- `CreateTransactionAsync_Transfer_WithValidAccounts_Succeeds`
- `ListTransactionsAsync_DoesNotReturnDeletedTransactions`

---

### Frontend

**Step 1 — Types**

`types/api/transactions.ts`:
```
TransactionDto { id, accountId, type, categoryId, categoryName, categoryColor,
                 amount, description, date, createdAt, isActive, transferAccountId? }
CreateTransactionRequestBody
UpdateTransactionRequestBody
```

`types/enums/transaction-type.ts` (or update `finance.ts`):
- Add `'transfer'` to `TransactionType`

**Step 2 — API client**

`api/transactions.ts`:
- `createTransaction(body)` → POST /transactions
- `listTransactions(filter?)` → GET /transactions
- `updateTransaction(id, body)` → PUT /transactions/{id}
- `deleteTransaction(id)` → DELETE /transactions/{id}

`api/categories.ts`:
- `listCategories()` → GET /categories — needed to resolve category name → UUID

**Step 3 — Mapper**

`mappers/transactionMappers.ts`:
- `mapTransactionDtoToTransaction(dto)` → `Transaction`
- `toCreateTransactionRequestBody(tx, categoryId)` → API body
- `toUpdateTransactionRequestBody(tx, categoryId)` → API body

**Step 4 — Store**

`FinanceStore.tsx`: implement `loadTransactions`, `addTransaction`, `updateTransaction`, `deleteTransaction`

**Step 5 — Transactions.tsx**

- Load transactions on mount (after auth hydration)
- Form `onSave` for create and edit → store actions
- Delete button with `confirm()` → `deleteTransaction`
- Transfer type in form: show `transferAccountId` account selector
- Error banner + loading state (same pattern as Accounts page)

---

## Implementation Order

1. Backend entity + enum + migration
2. Backend repository additions
3. Backend service additions (GetById, Update, Delete, Transfer in Create)
4. Backend endpoints
5. Backend tests
6. Frontend types
7. Frontend API client + categories API
8. Frontend mapper
9. Frontend store wiring
10. Frontend Transactions.tsx wiring
