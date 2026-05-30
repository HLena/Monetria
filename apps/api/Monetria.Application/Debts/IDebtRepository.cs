using Monetria.Domain.Entities;

namespace Monetria.Application.Debts;

public interface IDebtRepository
{
    Task AddAsync(Debt debt, CancellationToken cancellationToken = default);
    Task<Debt?> GetByIdAsync(Guid debtId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Debt>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    void Remove(Debt debt);
}
