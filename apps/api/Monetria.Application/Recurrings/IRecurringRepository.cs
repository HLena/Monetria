using Monetria.Domain.Entities;

namespace Monetria.Application.Recurrings;

public interface IRecurringRepository
{
    Task AddAsync(Recurring recurring, CancellationToken cancellationToken = default);
    Task<Recurring?> GetByIdAsync(Guid recurringId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Recurring>> ListByUserIdAsync(Guid userId, RecurringFilterRequest filter, CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAsync(Guid userId, RecurringFilterRequest filter, CancellationToken cancellationToken = default);
}
