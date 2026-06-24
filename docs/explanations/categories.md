# Categories

## 2026-05-20 — Fix 500 error on GET /categories

**Problem:** `GET /categories` returned a 500 Internal Server Error for every authenticated request.

**Root cause:** In `CategoryEndpoints.ListCategoriesAsync`, the `bool includeInactive` parameter had no default value. In .NET 10 Minimal APIs, non-nullable value types bound from the query string are treated as required. When the client does not pass `includeInactive` in the query string, ASP.NET Core throws a `BadHttpRequestException` ("Required parameter was not provided from query string"). This exception is not handled by `ErrorHandlingMiddleware`, so it falls through to the 500 catch-all.

Additionally, `TransactionType? type` (a nullable type) also lacked an explicit `= null`, which caused a C# compile error once `includeInactive = false` was introduced (C# requires optional parameters to come after all required ones).

**Fix:** In `CategoryEndpoints.cs`:
- Moved `ClaimsPrincipal user`, `ICategoryService categoryService`, and `CancellationToken cancellationToken` before the query-string parameters.
- Added `= null` default to `TransactionType? type`.
- Added `= false` default to `bool includeInactive`.

**File changed:** `backend/Monetria.API/Endpoints/CategoryEndpoints.cs`

## 2026-06-23 — CategorySelect shared component

Replaced the icon-grid category pickers in all forms with a reusable `CategorySelect` dropdown that shows each category's icon circle next to its name.

**New file:** `apps/web/src/app/components/shared/CategorySelect.tsx`
- Custom dropdown (not native `<select>`) — renders a trigger button showing the selected category's icon + name + chevron, and a floating list of all options each with icon + name.
- Accepts `CategoryOption[]` (`{ id, name, iconKey?, color? }`) so it works with both real `CategoryDto` objects and legacy string-based category arrays.
- Always passes `category={opt.name}` to `CategoryIconCircle` as a name-based icon fallback, so string categories that aren't in the explicit `iconKey` map still resolve correctly.

**Updated forms:**
- `BudgetForm` — uses expense categories from `useFinanceStore()`, filtered by `type === 'Expense'`
- `TransactionForm` — uses `visibleCategories` (already filtered by transaction type) from store
- `RecurringForm` — maps `EXPENSE_CATEGORIES` strings to options with colors from `CATEGORY_COLORS`
- `SavingsGoalForm` — maps `GOAL_CATEGORIES` strings to options with colors where available

**Exported from:** `apps/web/src/app/components/shared/index.ts`
