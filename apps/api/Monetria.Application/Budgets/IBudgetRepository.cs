using Monetria.Domain.Entities;

namespace Monetria.Application.Budgets;

public interface IBudgetRepository
{
    Task AddAsync(Budget budget, CancellationToken cancellationToken = default);
    Task<Budget?> GetByIdAsync(Guid budgetId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Budget>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<decimal> GetSpentAmountAsync(Guid userId, Guid categoryId, int month, int year, CancellationToken cancellationToken = default);
    void Remove(Budget budget);
}
