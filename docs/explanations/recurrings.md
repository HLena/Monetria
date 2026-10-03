# Recurrings — Explicación del dominio

## 2026-07-14 — Reorganización de `hooks/` por dominio

### Contexto

`hooks/` era una carpeta plana (`useAccounts.ts`, `useAccountTransactions.ts`, `useTransactionsPaginated.ts`, `useSettingsCategories.ts`, ...). Al construir `Recurrings.tsx`/`Budgets.tsx` surgió la pregunta de si convenía un hook único por página que cargue todo (cuentas + categorías + su propio dominio) o componer hooks pequeños de una sola responsabilidad. Se optó por lo segundo, y de paso se reorganizó `hooks/` en subcarpetas por dominio, cada una con su propio `index.ts` (mismo patrón que `components/<feature>/`).

### Estructura resultante

Un dominio solo se convierte en subcarpeta si agrupa **2+ archivos** — igual criterio que `components/<feature>/`. `accounts/` sí lo amerita (3 hooks); `budgets`, `categories`, `recurrings` y `transactions` quedaron con un único hook cada uno, así que viven planos en `hooks/` sin carpeta ni barrel propio:

```
hooks/
├── accounts/          (useAccount, useAccounts, useAccountTransactions + index.ts)
├── useTransactions.ts (antes useTransactionsPaginated — ver docs/explanations/transactions.md)
├── useCategories.ts   (unifica lectura + CRUD — ver docs/explanations/categories.md)
├── useBudgets.ts
├── useRecurrings.ts
└── index.ts           (re-exporta todo — los imports externos `from '@/app/hooks'` no cambian)
```

Los archivos se movieron con `git mv`/`mv` para preservar historial donde fue posible. El único ajuste interno fue el import cruzado de `useAccountTransactions.ts` (`PAGE_SIZE`, `TYPE_TO_DTO`), que apunta a `@/app/hooks/useTransactions` (el archivo directo, no el barrel raíz) para evitar un import circular (`accounts/index.ts` → `hooks/index.ts` → `accounts/index.ts`).

### Por qué no un hook único con hidratación de auth por página

Al diseñar `useBudgets`/`useRecurrings` se copió inicialmente el patrón de `useAccounts` (esperar `useAuthStore.persist.hasHydrated()` antes de cargar). Revisando el store se confirmó que **ese baile solo es necesario para `listAccounts(userId)`**, porque depende de `useAuthStore.getState().user?.userId` (Zustand persistido, con hidratación async). `loadCategories`, `loadBudgets` y `loadRecurrings` en cambio solo dependen de `getAuthToken()` (lectura síncrona de `localStorage`), así que no tienen esa condición de carrera — sus hooks son un simple `useEffect` sin guardas de hidratación.

### `useCategories` vs `useSettingsCategories`

Son intencionalmente distintos, no una duplicación:
- `useCategories()` (nuevo) — solo lectura, lee `categories` del `FinanceStore` global, para consumo en formularios (`RecurringForm`, `BudgetForm` vía sus páginas).
- `useSettingsCategories()` (existente) — CRUD completo con estado local propio (no usa el store) y updates optimistas, específico de la pantalla de ajustes de categorías.

### Páginas actualizadas

- `Budgets.tsx` — `useFinanceStore()` + `useEffect` manual → `useCategories()` + `useBudgets(filterMonth, filterYear)`.
- `Recurrings.tsx` — `useFinanceStore()` + `useEffect` manual → `useAccounts()` + `useCategories()` + `useRecurrings()`.
- `RecurringForm.tsx`, `BudgetForm.tsx`, `RecurringOccurrencesModal.tsx` — **sin cambios**, siguen leyendo `useFinanceStore()` directo sin disparar cargas: viven dentro de un modal en una página que ya garantiza los datos cargados vía su hook de dominio, así que agregarles su propio `useEffect` de carga solo produciría refetches redundantes cada vez que se abre el modal/formulario.

### Advertencia conocida (no introducida por este refactor)

`isLoading`/`error` son campos únicos y globales en `FinanceStoreState`, compartidos por todas las acciones. Si dos hooks de dominio están montados a la vez en la misma página (ej. `useAccounts()` + `useRecurrings()`), comparten el mismo booleano/mensaje. Arreglarlo de raíz requeriría loading/error por slice — fuera de alcance de este refactor.

## 2026-07-14 — Generación automática de ocurrencias + conexión del frontend al API real

### Contexto

Un escaneo del módulo detectó dos gaps: (1) pese a que `docs/explanations/recurrings.md` (sección de abajo) decía que `RecurringOccurrence` "se creaba automáticamente", **no existía ningún código que lo hiciera** — solo se creaban manualmente en tests; (2) el frontend (`pages/Recurrings.tsx`, `components/recurrings/RecurringForm.tsx`) usaba un modelo mock `FixedExpense` completamente desconectado del API real, con botones de guardar/borrar que eran no-ops literales (`onSave={() => {}}`).

### Backend: generación automática (`RecurringOccurrenceGenerationService`)

**Archivos nuevos:**
- `Application/Recurrings/RecurringTransactionBuilder.cs` — helper `internal static` extraído de `RecurringOccurrenceService` para no duplicar la construcción de `Transaction` (incluye el par de transferencia).
- `Application/Recurrings/IRecurringOccurrenceGenerationService.cs` / `RecurringOccurrenceGenerationService.cs`
- `Infrastructure/Jobs/RecurringOccurrenceGenerationHostedService.cs` — `BackgroundService` nativo (mismo patrón que `BudgetRecurrenceHostedService`), corre cada 24h.

**Archivos modificados:**
- `IRecurringRepository` / `RecurringRepository` — nuevo `ListActiveDueAsync(DateOnly today)` (todos los usuarios, `IsActive && NextDueDate <= today`, tracked para poder mutar).
- `MonetriaDbContext` — índice único `(RecurringId, ScheduledDate)` en `RecurringOccurrences` (migración `AddUniqueIndexRecurringOccurrenceScheduledDate`), red de seguridad ante duplicados.
- `DependencyInjection.cs` — registro del nuevo servicio y hosted service.

**Lógica** (`GenerateDueOccurrencesAsync`): por cada `Recurring` activo con `NextDueDate <= hoy`, un bucle "catch-up" (tope 366 iteraciones) que:

```
AmountType = Fixed         → crea la Transaction (o par si Type=Transfer) + RecurringOccurrence(AutoRegistered)
AmountType = Estimated     → RecurringOccurrence(Pending, SuggestedAmount = EstimatedAmount)
AmountType = VariableFree  → RecurringOccurrence(Pending, SuggestedAmount = null)

NextDueDate avanza según Frequency (Daily+1d, Weekly+7d, Biweekly+14d, Monthly+1mes, Yearly+1año)
Si NextDueDate > EndDate → IsActive = false
```

`SaveChangesAsync` se llama una vez por `Recurring` (no en un solo batch) para que un fallo puntual no bloquee al resto.

**Limitación conocida:** si el proceso estuvo caído todo un día, se pone al día en el siguiente tick (no hay pérdida de ocurrencias, solo demora). No hay locking distribuido entre instancias — el índice único protege contra duplicados.

**Tests añadidos (6):**
1. `GenerateDueOccurrencesAsync_WithFixedRecurringDue_CreatesTransactionAndAutoRegisteredOccurrence`
2. `GenerateDueOccurrencesAsync_WithEstimatedRecurringDue_CreatesPendingOccurrenceWithSuggestedAmount`
3. `GenerateDueOccurrencesAsync_WithVariableFreeRecurringDue_CreatesPendingOccurrenceWithoutSuggestedAmount`
4. `GenerateDueOccurrencesAsync_WithMultipleMissedPeriods_CatchesUpAllOccurrences`
5. `GenerateDueOccurrencesAsync_WhenNextDueDateExceedsEndDate_DeactivatesRecurring`
6. `GenerateDueOccurrencesAsync_CalledTwice_DoesNotDuplicate`

### Frontend: conexión al API real

- `types/api/recurrings.ts` — reescrito con los DTOs reales (`RecurringDto`, `RecurringListResponse`, `CreateRecurringRequestBody`, `UpdateRecurringRequestBody`, `RecurringOccurrenceDto`, `ConfirmOccurrenceRequestBody`). A diferencia de `Transaction`, los enums (`Type`, `AmountType`, `Frequency`, `Status`) se mantienen en PascalCase de punta a punta (igual que llegan del backend) — sin mapper de casing, para no introducir una capa de traducción innecesaria.
- `types/finance.ts` — se eliminó `FixedExpense`/`FixedExpensePeriod`/`fixedExpenseMonthlyEquivalent`; se agregó `Recurring`, `RecurringOccurrence` y `recurringMonthlyEquivalent(amount, frequency)`.
- `api/recurrings.ts` (nuevo) — `listRecurrings`, `createRecurring`, `updateRecurring`, `deactivateRecurring`, `listRecurringOccurrences`, `confirmRecurringOccurrence`, `skipRecurringOccurrence`.
- `store/FinanceStore.tsx` — `fixedExpenses` reemplazado por `recurrings: Recurring[]` + `recurringOccurrences: Record<string, RecurringOccurrence[]>` (cache por recurrente, cargado on-demand). No hay `deleteRecurring` — el backend solo expone `deactivate` (soft, vía `IsActive`).
- `components/recurrings/RecurringForm.tsx` — reescrito con los campos reales: `ToggleGroup` para `Type` (Income/Expense/Transfer) y `AmountType` (Fixed/Estimated/VariableFree, condiciona qué input de monto se muestra), `CategorySelect`, cuentas origen/destino (si Transfer), `Frequency`, fechas. El campo `NextDueDate` solo se expone al editar (en creación se sincroniza con `StartDate`).
- `components/recurrings/RecurringOccurrencesModal.tsx` (nuevo) — modal por recurrente que lista sus ocurrencias y permite Confirmar/Omitir las `Pending` (con input de monto cuando el tipo no es `Fixed`). Se decidió esta UI en vez de un endpoint nuevo para "todas las ocurrencias pendientes del usuario" para no ampliar el alcance del backend.
- `store/FinanceContext.tsx` — se removieron los campos `fixedExpenses`/`addFixedExpense`/`updateFixedExpense`/`deleteFixedExpense` (context legacy separado, `useFinance` no se invoca en ningún componente; solo se rompía por el rename de tipos y era código muerto).

## 2026-06-11 — Implementación de RecurringOccurrence endpoints

### Contexto

La entidad `RecurringOccurrence` existía en el dominio y se creaba automáticamente cuando un `Recurring` de tipo `Estimated` o `VariableFree` alcanzaba su `NextDueDate`. Sin embargo, no había ningún endpoint que permitiera al usuario gestionar esas ocurrencias. Esta sesión agrega los 3 endpoints faltantes.

### Qué se implementó

**Archivos creados:**

| Capa | Archivo |
|---|---|
| Application | `Recurrings/IRecurringOccurrenceRepository.cs` |
| Application | `Recurrings/IRecurringOccurrenceService.cs` |
| Application | `Recurrings/RecurringOccurrenceService.cs` |
| Infrastructure | `Recurrings/RecurringOccurrenceRepository.cs` |

**Archivos modificados:**
- `Recurrings/RecurringDtos.cs` — nuevos records `RecurringOccurrenceResponse` y `ConfirmOccurrenceRequest`
- `Infrastructure/DependencyInjection.cs` — registro de `IRecurringOccurrenceRepository` y `IRecurringOccurrenceService`
- `API/Endpoints/RecurringEndpoints.cs` — 3 nuevos endpoints bajo el grupo `/recurrings`
- `ApplicationServiceTests.cs` — 6 tests nuevos

**Sin migración** — la tabla `RecurringOccurrences` ya existía.

### Endpoints añadidos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/recurrings/{recurringId}/occurrences` | Lista ocurrencias de un recurrente |
| `PATCH` | `/recurrings/occurrences/{id}/confirm` | Confirma y crea Transaction |
| `PATCH` | `/recurrings/occurrences/{id}/skip` | Marca como omitida |

### Lógica de confirm

El confirm es la operación más crítica: crea una `Transaction` real a partir de la ocurrencia.

```
AmountType = VariableFree  → request.RealAmount obligatorio y > 0
AmountType = Estimated     → request.RealAmount si viene, si no usa SuggestedAmount
AmountType = Fixed         → InvalidOperationException (se auto-registran)

Type = Transfer → crea 2 Transaction con mismo TransferPairId (atómico)
Type = Income/Expense → crea 1 Transaction

occurrence.Status   = Confirmed
occurrence.RealAmount = realAmount
occurrence.TransactionId = id de la transaction creada
occurrence.ConfirmedAt = DateTime.UtcNow
```

Todo se guarda en una sola `UnitOfWork.SaveChangesAsync()`.

### Por qué Skipped ≠ Amount=0

Una ocurrencia omitida no debe entrar en cálculos de promedios históricos ni en reportes de gastos del período. Si se usara `Amount=0`, contaminaría los promedios con valores artificialmente bajos. El estado `Skipped` permite filtrar explícitamente estas ocurrencias al calcular estadísticas.

### Ownership

`RecurringOccurrence` no tiene `UserId` directo. La validación se hace incluyendo la navegación `Recurring` en el repositorio (`Include(o => o.Recurring)`) y verificando `occurrence.Recurring.UserId == userId`.

### Tests añadidos (6)

1. `ConfirmOccurrenceAsync_Estimated_CreatesTransactionAndUpdatesStatus`
2. `ConfirmOccurrenceAsync_VariableFree_UsesProvidedAmount`
3. `ConfirmOccurrenceAsync_VariableFree_WithoutAmount_ThrowsArgumentException`
4. `SkipOccurrenceAsync_SetsStatusSkipped`
5. `SkipOccurrenceAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException`
6. `ConfirmOccurrenceAsync_AlreadyConfirmed_ThrowsInvalidOperationException`

Todos pasan (6/6).

## 2026-06-10 — Paginación en GET /recurrings

### Qué se implementó

`GET /recurrings` ahora devuelve `PagedResponse<RecurringResponse>` en lugar de una lista plana.

**Nuevos parámetros de query:**
- `includeInactive` (bool, default `false`) — incluye recurrentes desactivados
- `page` (int, default `1`)
- `pageSize` (int, default `20`, máx `100`)

**Respuesta:**
```json
{
  "items": [...],
  "totalCount": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

**Archivos modificados:**
- `RecurringDtos.cs` — agregado `RecurringFilterRequest`
- `IRecurringRepository.cs` — firma actualizada + `CountByUserIdAsync`
- `RecurringRepository.cs` — `BuildQuery()` + paginación con `Skip/Take`
- `IRecurringService.cs` — retorno cambiado a `PagedResponse<RecurringResponse>`
- `RecurringService.cs` — implementación de paginación
- `RecurringEndpoints.cs` — acepta `page`, `pageSize`, `includeInactive`
- `DashboardService.cs` — actualizado para usar la nueva firma del repositorio

### Fix: SavingsGoal.IsActive

La entidad `SavingsGoal` no tenía campo `IsActive`, lo que causaba que el filtro `includeInactive` en el repositorio no compilara. Se agregó el campo, se actualizó la configuración de EF Core en `MonetriaDbContext`, y se cambió `DeleteAsync` de hard delete a soft delete (`IsActive = false`). Migración: `AddSavingsGoalIsActive`.

## 2026-06-23 — Refactor: eliminación de duplicado y simplificación de página

### Qué se cambió
- `RecurringForm` estaba definida inline en `pages/Recurrings.tsx` Y como componente exportado en `components/recurrings/RecurringForm.tsx` — se eliminó el duplicado inline
- `pages/Recurrings.tsx` ahora importa `RecurringForm` de `components/recurrings/RecurringForm.tsx`
- Las summary cards usan `SummaryCard` (variantes `indigo`, `slate`)
- El empty state usa `EmptyState`
- Se eliminaron imports sin uso (`useFinance`, `EXPENSE_CATEGORIES`, `React`)
