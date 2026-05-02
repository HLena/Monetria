using Microsoft.EntityFrameworkCore;
using Monetria.Application.Debts;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Debts;

public sealed class DebtRepository(MonetriaDbContext dbContext) : IDebtRepository
{
    public async Task AddAsync(Debt debt, CancellationToken cancellationToken = default)
    {
        await dbContext.Debts.AddAsync(debt, cancellationToken);
    }

    public Task<Debt?> GetByIdAsync(Guid debtId, CancellationToken cancellationToken = default)
    {
        return dbContext.Debts.FirstOrDefaultAsync(debt => debt.Id == debtId, cancellationToken);
    }

    public async Task<IReadOnlyList<Debt>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Debts
            .AsNoTracking()
            .Where(debt => debt.UserId == userId)
            .OrderBy(debt => debt.NextPaymentDate)
            .ThenBy(debt => debt.Name)
            .ToListAsync(cancellationToken);
    }

    public void Remove(Debt debt)
    {
        dbContext.Debts.Remove(debt);
    }
}
