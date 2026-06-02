namespace Monetria.Application.Recurrings;

public interface IRecurringService
{
    Task<RecurringResponse> CreateAsync(Guid userId, CreateRecurringRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecurringResponse>> ListByUserIdAsync(Guid userId, bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<RecurringResponse> UpdateAsync(Guid userId, Guid recurringId, UpdateRecurringRequest request, CancellationToken cancellationToken = default);
    Task<RecurringResponse> DeactivateAsync(Guid userId, Guid recurringId, CancellationToken cancellationToken = default);
}
