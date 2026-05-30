namespace Monetria.Application.Budgets;

public interface IBudgetService
{
    Task<BudgetResponse> CreateAsync(Guid userId, CreateBudgetRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BudgetResponse>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<BudgetResponse> UpdateAsync(Guid userId, Guid budgetId, UpdateBudgetRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid budgetId, CancellationToken cancellationToken = default);
}
