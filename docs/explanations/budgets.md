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

## 2026-06-23 — Refactor: extracción de formulario y simplificación de página

### Qué se cambió
- `BudgetForm` extraído de `pages/Budgets.tsx` a `components/budgets/BudgetForm.tsx`
- `pages/Budgets.tsx` ahora importa `BudgetForm`, `SummaryCard` y `EmptyState` desde sus respectivos módulos
- Las summary cards usan el componente `SummaryCard` (variantes `indigo`, `rose`, `amber`, `emerald`)
- El empty state usa el componente `EmptyState`
- Se añadieron variantes `amber` y `purple` a `components/ui/SummaryCard.tsx`

## 2026-06-23 — Toggles de moneda, periodo y alerta en BudgetForm / TransactionForm

**Nuevo tipo `Currency`** en `finance.ts`: `'PEN'` (S/) y `'USD'` ($). Constante `CURRENCY_SYMBOL` para resolver el símbolo. `Budget` añade `currency?: Currency` y `alertOnLimit?: boolean`. `Transaction` añade `currency?: Currency`.

**Nuevo componente `ToggleGroup`** en `shared/`: pill toggle genérico de N opciones con size `sm`|`md`. Reutilizado para moneda y periodo.

**BudgetForm**:
- Label "Límite *" sin texto de moneda
- Toggle moneda (fila completa, label "Moneda")
- Input límite muestra símbolo como prefijo (`pl-9`, `left-3`)
- Toggle periodo Mensual/Semanal (reemplaza `<select>`) en mismo grid 2-col
- Switch iOS de alerta al límite — card con descripción + slider animado

**TransactionForm**:
- Toggle moneda (size sm, inline derecha del label "Monto")
- Input monto muestra símbolo como prefijo
- `currency` incluido en el objeto enviado a `onSave`

## 2026-06-24 — Conexión al API real: BudgetForm + Budgets.tsx + FinanceStore

### Qué se cambió

**Tipo `Budget` en `finance.ts`** alineado con el backend:
- Eliminados: `limit`, `period`, `color`, `currency?`, `alertOnLimit?`
- Añadidos: `limitAmount`, `month`, `year`, `spentAmount`, `rolloverUnused`

**Nuevos archivos:**
- `types/api/budgets.ts` — DTOs: `BudgetDto`, `CreateBudgetRequestBody`, `UpdateBudgetRequestBody`
- `api/budgets.ts` — `listBudgets(month?, year?)`, `createBudget`, `updateBudget`, `deleteBudget`

**`BudgetForm.tsx`** reescrito:
- Eliminados: toggle de moneda, toggle Mensual/Semanal, switch `alertOnLimit`, ColorPicker
- Campos reales: `categoryId` (CategorySelect), `limitAmount` (AmountInput sin toggle de moneda), `rolloverUnused` (ToggleSwitch)
- Periodo mostrado como pill de solo lectura con mes y año actuales
- Validaciones con `ErrorMsg`: categoría requerida, límite > 0

**`FinanceStore.tsx`** — añadidas 4 acciones de presupuesto:
- `loadBudgets(month?, year?)` — filtra por mes/año actual al cargar
- `addBudget` — llama `createBudget` y recarga la lista
- `updateBudget` — llama `updateBudget` y recarga la lista
- `deleteBudget` — llama `deleteBudget` y recarga la lista
- Helper `mapBudgetDto(dto): Budget` para convertir DTO → modelo UI

**`Budgets.tsx`** reescrito:
- Eliminadas: referencias a `useFinance`, `formatCurrency`, `getCurrentMonthKey`, `getMonthKey` de FinanceContext
- Eliminados: `CATEGORY_COLORS`, `budget.category`, `budget.period`, `budget.color`, `budget.limit`
- Carga presupuestos del mes actual en `useEffect`
- `onSave` llama `addBudget` o `updateBudget` según modo (crear/editar)
- Delete llama `deleteBudget(budget.id)`
- Nombre de categoría resuelto desde `categories` del store por `budget.categoryId`
- Progress bar usa `budget.spentAmount` del backend (ya calculado)
- Cards con estado visual: verde (ok), ámbar (>80%), rojo (excedido)
- 3 summary cards: presupuesto total, gastado, categorías excedidas

**`Dashboard.tsx` y `Reports.tsx`** — referencias a `budget.category`, `budget.limit`, `budget.color` actualizadas:
- `overBudget` ahora usa `b.spentAmount > b.limitAmount` (antes calculaba manualmente desde transacciones)
- `budgetPerformance` usa `b.spentAmount`, `b.limitAmount`, y resuelve nombre/color por `b.categoryId` desde el store de categorías
