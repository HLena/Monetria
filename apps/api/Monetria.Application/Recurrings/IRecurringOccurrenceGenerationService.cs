namespace Monetria.Application.Recurrings;

public interface IRecurringOccurrenceGenerationService
{
    Task GenerateDueOccurrencesAsync(CancellationToken cancellationToken = default);
}
