namespace Monetria.Application.Budgets;

public interface IBudgetRecurrenceService
{
    Task GenerateForCurrentPeriodAsync(CancellationToken cancellationToken = default);
}
