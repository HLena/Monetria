using Monetria.Domain.Entities;

namespace Monetria.Application.Recurrings;

public interface IRecurringOccurrenceRepository
{
    Task AddAsync(RecurringOccurrence occurrence, CancellationToken cancellationToken = default);
    Task<RecurringOccurrence?> GetByIdAsync(Guid occurrenceId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecurringOccurrence>> ListByRecurringIdAsync(Guid recurringId, CancellationToken cancellationToken = default);
}
