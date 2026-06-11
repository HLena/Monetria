using Monetria.Domain.Entities;

namespace Monetria.Application.SavingsGoals;

public interface ISavingsGoalRepository
{
    Task AddAsync(SavingsGoal savingsGoal, CancellationToken cancellationToken = default);
    Task<SavingsGoal?> GetByIdAsync(Guid savingsGoalId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SavingsGoal>> ListByUserIdAsync(Guid userId, bool includeInactive = false, CancellationToken cancellationToken = default);
}
