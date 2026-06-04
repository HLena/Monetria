using Microsoft.EntityFrameworkCore;
using Monetria.Application.Budgets;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
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
            .OrderBy(budget => budget.Year)
            .ThenBy(budget => budget.Month)
            .ToListAsync(cancellationToken);
    }

    public async Task<decimal> GetSpentAmountAsync(
        Guid userId,
        Guid categoryId,
        int month,
        int year,
        CancellationToken cancellationToken = default)
    {
        return await (
            from t in dbContext.Transactions
            join a in dbContext.Accounts on t.FromAccountId equals a.Id
            where t.IsActive
                && t.Type == TransactionType.Expense
                && t.CategoryId == categoryId
                && t.Date.Month == month
                && t.Date.Year == year
                && a.UserId == userId
            select t.Amount
        ).SumAsync(cancellationToken);
    }

    public void Remove(Budget budget)
    {
        dbContext.Budgets.Remove(budget);
    }
}
