using Microsoft.EntityFrameworkCore;
using Monetria.Application.Budgets;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Budgets;

public sealed class BudgetRepository(MonetriaDbContext dbContext) : IBudgetRepository
{
    public async Task AddAsync(Budget budget, CancellationToken cancellationToken = default)
    {
        await dbContext.Budgets.AddAsync(budget, cancellationToken);
    }

    public Task<Budget?> GetByIdAsync(Guid budgetId, CancellationToken cancellationToken = default)
    {
        return dbContext.Budgets.FirstOrDefaultAsync(budget => budget.Id == budgetId, cancellationToken);
    }

    public async Task<IReadOnlyList<Budget>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Budgets
            .AsNoTracking()
            .Where(budget => budget.UserId == userId)
            .OrderBy(budget => budget.Category)
            .ThenBy(budget => budget.Period)
            .ToListAsync(cancellationToken);
    }

    public void Remove(Budget budget)
    {
        dbContext.Budgets.Remove(budget);
    }
}
