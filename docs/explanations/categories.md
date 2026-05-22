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
