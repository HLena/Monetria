# Budgets — Explicación del dominio

## 2026-06-10 — Filtros month/year + tests

### Qué se implementó

`GET /budgets` ahora acepta filtros opcionales `?month=6&year=2026` para retornar solo los presupuestos del período indicado. Sin filtros, devuelve todos los presupuestos del usuario.

**Archivos modificados:**
- `IBudgetRepository.cs` — `ListByUserIdAsync(Guid, int? month, int? year, ...)`
- `BudgetRepository.cs` — filtros opcionales de month/year en la query
- `IBudgetService.cs` — mismos parámetros opcionales
- `BudgetService.cs` — pasa los filtros al repositorio
- `BudgetEndpoints.cs` — acepta `month` y `year` como query params

### Tests agregados

1. `CreateBudgetAsync_WithValidRequest_Succeeds`
2. `CreateBudgetAsync_WithZeroLimitAmount_ThrowsArgumentException`
3. `CreateBudgetAsync_WithInvalidMonth_ThrowsArgumentException`
4. `DeleteBudgetAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException`
5. `ListBudgetsAsync_WithMonthFilter_ReturnsOnlyMatchingBudgets`

### Reglas de negocio

- `LimitAmount > 0` requerido
- `Month` entre 1 y 12
- `Year > 0`
- `SpentAmount` es calculado: `SUM(transactions)` para ese `CategoryId + Month + Year`
- Unicidad implícita: `(UserId, CategoryId, Month, Year)` — no hay restricción de BD pero el negocio lo considera único
- Budget no tiene soft delete — se borra físicamente (es metadata de planificación, no dato financiero)
