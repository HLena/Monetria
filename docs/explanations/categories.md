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

## 2026-07-08 — Per-user system category preferences (UserCategoryPreference)

**Problem:** `Category.IsActive` was a global flag — toggling a system category in Settings would affect all users, not just the one making the change.

**Solution:** New `UserCategoryPreference` entity with composite PK `(UserId, CategoryId)` stores per-user activation overrides for system categories only.

**New files:**
- `apps/api/Monetria.Domain/Entities/UserCategoryPreference.cs` — entity with `UserId`, `CategoryId`, `IsActive`
- `apps/api/Monetria.Application/Categories/IUserCategoryPreferenceRepository.cs` — interface: `ListByUserIdAsync`, `GetAsync`, `AddAsync`
- `apps/api/Monetria.Infrastructure/Categories/UserCategoryPreferenceRepository.cs` — EF Core implementation
- `apps/api/Monetria.Infrastructure/Persistence/Migrations/20260708000018_AddUserCategoryPreference.cs` — migration

**Backend changes:**
- `CategoryService.ListByUserIdAsync` — loads preferences and overlays them on system categories' `IsActive` before filtering
- `CategoryService.SetSystemCategoryPreferenceAsync` — upserts a `UserCategoryPreference` row; rejects non-system categories
- `CategoryService.DeactivateAsync` / `ActivateAsync` — now reject system categories with an `InvalidOperationException`
- `CategoryEndpoints` — new `PATCH /categories/{categoryId}/preference` endpoint
- `DependencyInjection.cs` — registers `IUserCategoryPreferenceRepository`

**Frontend changes:**
- `apps/web/src/app/api/categories.ts` — added `setSystemCategoryPreference(id, isActive)`
- `CategoriesSection.tsx` — `toggleDefaultCategory` now calls `setSystemCategoryPreference` instead of `deactivateCategory`/`activateCategory`

## 2026-07-08 — Remove IsActive from Category; per-user toggle via UserCategoryPreference

**Change:** `Category.IsActive` column removed entirely. Visibility of system categories is now controlled per-user via `UserCategoryPreference`.

**Rules:**
- System categories (`IsDefault = true`): visibility is `UserCategoryPreference.IsActive` where it exists, `true` (active) by default if no record exists.
- User-created categories: always visible (no toggle concept); deleted via `DELETE /categories/{id}` (physical delete — FK constraint prevents deletion if transactions reference the category).
- `UserCategoryPreference` only stores records for system categories; user categories are never stored there.

**Backend changes:**
- `Category.cs` — removed `IsActive` property
- `MonetriaDbContext.ConfigureCategory` — removed `IsActive` column config and index; added plain `(UserId, Type)` index
- Seed data — removed `isActive` parameter; the 3 legacy "deactivated" categories (Vivienda, Ahorro, Ingresos) are now seeded as normal visible categories
- `ICategoryRepository` / `CategoryRepository` — removed `includeInactive` parameter; repo always returns all matching categories; added `DeleteAsync`
- `CategoryService.ListByUserIdAsync` — computes `effectiveIsActive` from preferences for system cats; user cats always `true`; service-level `includeInactive` filter still supported
- `CategoryService` — removed `DeactivateAsync`/`ActivateAsync`; added `DeleteAsync` (physical delete, system categories rejected)
- `CategoryEndpoints` — replaced `PATCH /{id}/deactivate` + `PATCH /{id}/activate` with `DELETE /{id}`
- `TransactionService` / `RecurringService` — removed `category.IsActive` guards (categories are always usable)
- `ApplicationServiceTests` — removed `WithInactiveCategory` test; removed `IsActive = true` from `AddCategory` helper
- Migration: `20260708001647_RemoveIsActiveFromCategory`

**Frontend changes:**
- `api/categories.ts` — replaced `deactivateCategory`/`activateCategory` with `deleteCategory` (HTTP DELETE)
- `CategoriesSection.tsx` — `deleteCategory` uses new HTTP DELETE endpoint
