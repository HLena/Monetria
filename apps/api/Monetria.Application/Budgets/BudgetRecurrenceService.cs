using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.Budgets;

public sealed class BudgetRecurrenceService(
    IBudgetRepository budgetRepository,
    IUnitOfWork unitOfWork) : IBudgetRecurrenceService
{
    public async Task GenerateForCurrentPeriodAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var month = now.Month;
        var year = now.Year;

        var candidates = await budgetRepository.ListLatestRecurringBeforePeriodAsync(month, year, cancellationToken);
        if (candidates.Count == 0)
            return;

        var existingForPeriod = await budgetRepository.ListByPeriodAsync(month, year, cancellationToken);
        var existingKeys = existingForPeriod
            .Select(budget => (budget.UserId, budget.CategoryId))
            .ToHashSet();

        foreach (var candidate in candidates)
        {
            if (existingKeys.Contains((candidate.UserId, candidate.CategoryId)))
                continue;

            var newBudget = new Budget
            {
                Id = Guid.NewGuid(),
                UserId = candidate.UserId,
                CategoryId = candidate.CategoryId,
                LimitAmount = candidate.LimitAmount,
                Month = month,
                Year = year,
                IsRecurring = true,
                CreatedAt = now
            };

            await budgetRepository.AddAsync(newBudget, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
