using Microsoft.EntityFrameworkCore;
using Monetria.Application.Accounts;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Accounts;

public sealed class AccountRepository(MonetriaDbContext dbContext) : IAccountRepository
{
    public async Task AddAsync(Account account, CancellationToken cancellationToken = default)
    {
        await dbContext.Accounts.AddAsync(account, cancellationToken);
    }

    public Task<Account?> GetByIdAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(account => account.Id == accountId, cancellationToken);
    }

    public Task<bool> ExistsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return dbContext.Accounts.AnyAsync(account => account.Id == accountId, cancellationToken);
    }

    public async Task<IReadOnlyList<Account>> ListByUserIdAsync(
        Guid userId,
        AccountType? type = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Accounts
            .AsNoTracking()
            .Where(account => account.UserId == userId);

        if (type.HasValue)
        {
            query = query.Where(account => account.Type == type.Value);
        }

        return await query
            .OrderBy(account => account.Name)
            .ThenBy(account => account.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task UpdateAsync(Account account, CancellationToken cancellationToken = default)
    {
        dbContext.Accounts.Update(account);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await dbContext.Accounts.FindAsync([accountId], cancellationToken);
        if (account is not null)
            dbContext.Accounts.Remove(account);
    }
}
