namespace Monetria.Application.Recurrings;

public interface IRecurringOccurrenceService
{
    Task<IReadOnlyList<RecurringOccurrenceResponse>> ListByRecurringIdAsync(Guid userId, Guid recurringId, CancellationToken cancellationToken = default);
    Task<RecurringOccurrenceResponse> ConfirmAsync(Guid userId, Guid occurrenceId, ConfirmOccurrenceRequest request, CancellationToken cancellationToken = default);
    Task<RecurringOccurrenceResponse> SkipAsync(Guid userId, Guid occurrenceId, CancellationToken cancellationToken = default);
}
