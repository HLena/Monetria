using Monetria.Domain.Entities;

namespace Monetria.Application.FixedExpenses;

public interface IFixedExpenseRepository
{
    Task AddAsync(FixedExpense fixedExpense, CancellationToken cancellationToken = default);
    Task<FixedExpense?> GetByIdAsync(Guid fixedExpenseId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FixedExpense>> ListByUserIdAsync(
        Guid userId,
        bool includeInactive = false,
        CancellationToken cancellationToken = default);
}
