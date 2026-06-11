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
