# Recurrings — Explicación del dominio

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
