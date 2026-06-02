using Monetria.Domain.Entities;

namespace Monetria.Application.Recurrings;

public interface IRecurringRepository
{
    Task AddAsync(Recurring recurring, CancellationToken cancellationToken = default);
    Task<Recurring?> GetByIdAsync(Guid recurringId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Recurring>> ListByUserIdAsync(
        Guid userId,
        bool includeInactive = false,
        CancellationToken cancellationToken = default);
}
