using Microsoft.EntityFrameworkCore;
using Monetria.Application.Transactions;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Transactions;

public sealed class TransactionRepository(MonetriaDbContext dbContext) : ITransactionRepository
{
    public async Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        await dbContext.Transactions.AddAsync(transaction, cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> ListByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Transactions
            .AsNoTracking()
            .Include(transaction => transaction.Category)
            .Where(transaction => dbContext.Accounts.Any(account =>
                account.Id == transaction.AccountId &&
                account.UserId == userId));

        query = ApplyFilters(query, filter);

        return await OrderTransactions(query).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> ListByAccountIdAsync(
        Guid accountId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Transactions
            .AsNoTracking()
            .Include(transaction => transaction.Category)
            .Where(transaction => transaction.AccountId == accountId);

        query = ApplyFilters(query, filter with { AccountId = null });

        return await OrderTransactions(query).ToListAsync(cancellationToken);
    }

    private static IQueryable<Transaction> ApplyFilters(
        IQueryable<Transaction> query,
        TransactionFilterRequest filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Description))
        {
            var description = filter.Description.Trim();
            query = query.Where(transaction =>
                transaction.Description != null &&
                transaction.Description.Contains(description));
        }

        if (filter.Type.HasValue)
        {
            query = query.Where(transaction => transaction.Type == filter.Type.Value);
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(transaction => transaction.CategoryId == filter.CategoryId.Value);
        }

        if (filter.AccountId.HasValue)
        {
            query = query.Where(transaction => transaction.AccountId == filter.AccountId.Value);
        }

        if (filter.Month.HasValue)
        {
            var startDate = new DateTime(filter.Year!.Value, filter.Month.Value, 1);
            var endDate = startDate.AddMonths(1);
            query = query.Where(transaction => transaction.Date >= startDate && transaction.Date < endDate);
        }
        else if (filter.Year.HasValue)
        {
            var startDate = new DateTime(filter.Year.Value, 1, 1);
            var endDate = startDate.AddYears(1);
            query = query.Where(transaction => transaction.Date >= startDate && transaction.Date < endDate);
        }

        return query;
    }

    private static IOrderedQueryable<Transaction> OrderTransactions(IQueryable<Transaction> query)
    {
        return query
            .OrderByDescending(transaction => transaction.Date)
            .ThenByDescending(transaction => transaction.CreatedAt);
    }
}
