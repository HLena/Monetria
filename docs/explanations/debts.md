# Debts — Explicación del dominio

## 2026-06-10 — Filtro isActive + tests

### Qué se implementó

`GET /debts` ahora acepta `?isActive=true` o `?isActive=false` para filtrar deudas activas o pagadas. Sin filtro devuelve todas.

**Archivos modificados:**
- `IDebtRepository.cs` — `ListByUserIdAsync(Guid, bool? isActive, ...)`
- `DebtRepository.cs` — filtro opcional `isActive` en la query
- `IDebtService.cs` — mismo parámetro opcional
- `DebtService.cs` — pasa el filtro al repositorio
- `DebtEndpoints.cs` — acepta `isActive` como query param

### Tests agregados

1. `CreateDebtAsync_WithValidRequest_Succeeds`
2. `CreateDebtAsync_WithNegativeOriginalAmount_ThrowsArgumentException`
3. `CreateDebtAsync_WithRemainingExceedingOriginal_ThrowsArgumentException`
4. `DeleteDebtAsync_SetsIsActiveFalse`
5. `PayDebtAsync_ReducesRemainingAmount`
6. `PayDebtAsync_WhenFullyPaid_SetsIsActiveFalse`
7. `ListDebtsAsync_WithIsActiveFilter_ReturnsOnlyActive`

### Reglas de negocio clave

- `OriginalAmount > 0`, `MinimumPayment > 0`
- `RemainingAmount >= 0` y `<= OriginalAmount`
- `InterestRate >= 0` (puede ser 0 para deudas sin interés)
- Pago (`PayAsync`): crea `Transaction(Expense)` + reduce `RemainingAmount`, atómico en una `UnitOfWork`
- Cuando `RemainingAmount <= 0`: `IsActive = false` automáticamente
- Pago requiere `AccountId` en la deuda — si no tiene, lanza `InvalidOperationException`
- No se puede pagar más del `RemainingAmount`
- Soft delete: `IsActive = false`

## 2026-06-23 — Refactor: extracción de componentes y simplificación de página

### Qué se cambió
- `DebtForm` extraído de `pages/DebtPlanning.tsx` a `components/debts/DebtForm.tsx`
  - `DEBT_TYPES` exportado desde el mismo archivo para reutilización en la página
- `DebtCalculator` extraído a `components/debts/DebtCalculator.tsx`
  - Ahora soporta dark mode correctamente
- `pages/DebtPlanning.tsx` usa `SummaryCard` (variantes `rose`, `emerald`, `amber`, `indigo`) y `EmptyState`
- `daysUntilDue` movida al scope del módulo de la página (helper puro, no necesitaba ser inline en el render)
