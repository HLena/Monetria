using Microsoft.EntityFrameworkCore;
using Monetria.Application.FixedExpenses;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.FixedExpenses;

public sealed class FixedExpenseRepository(MonetriaDbContext dbContext) : IFixedExpenseRepository
{
    public async Task AddAsync(FixedExpense fixedExpense, CancellationToken cancellationToken = default)
    {
        await dbContext.FixedExpenses.AddAsync(fixedExpense, cancellationToken);
    }

    public Task<FixedExpense?> GetByIdAsync(Guid fixedExpenseId, CancellationToken cancellationToken = default)
    {
        return dbContext.FixedExpenses.FirstOrDefaultAsync(expense => expense.Id == fixedExpenseId, cancellationToken);
    }

    public async Task<IReadOnlyList<FixedExpense>> ListByUserIdAsync(
        Guid userId,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.FixedExpenses
            .AsNoTracking()
            .Where(expense => expense.UserId == userId);

        if (!includeInactive)
        {
            query = query.Where(expense => expense.IsActive);
        }

        return await query
            .OrderBy(expense => expense.DueDay)
            .ThenBy(expense => expense.Name)
            .ToListAsync(cancellationToken);
    }
}
