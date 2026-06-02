using Microsoft.EntityFrameworkCore;
using Monetria.Application.Transactions;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Transactions;

public sealed class TransactionRepository(MonetriaDbContext dbContext) : ITransactionRepository
{
    public Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        dbContext.Transactions.Add(transaction);
        return Task.CompletedTask;
    }

    public async Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Transactions
            .Include(transaction => transaction.Category)
            .FirstOrDefaultAsync(transaction => transaction.Id == id && transaction.IsActive, cancellationToken);
    }

    public async Task<decimal> GetAccountBalanceDeltaAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Transactions
            .AsNoTracking()
            .Where(t => t.IsActive && t.FromAccountId == accountId)
            .SumAsync(t =>
                t.Type == TransactionType.Income ? t.Amount :
                t.Type == TransactionType.Expense ? -t.Amount :
                t.ToAccountId.HasValue ? -t.Amount : t.Amount,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> ListByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        var userAccountIds = dbContext.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id);

        var query = dbContext.Transactions
            .AsNoTracking()
            .Include(transaction => transaction.Category)
            .Where(transaction => transaction.IsActive && userAccountIds.Contains(transaction.FromAccountId));

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
            .Where(transaction => transaction.IsActive && transaction.FromAccountId == accountId);

        query = ApplyFilters(query, filter with { FromAccountId = null });

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

        if (filter.FromAccountId.HasValue)
        {
            query = query.Where(transaction => transaction.FromAccountId == filter.FromAccountId.Value);
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

    public async Task<Transaction?> GetTransferPairAsync(Guid transactionId, Guid transferPairId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Transactions
            .FirstOrDefaultAsync(t => t.TransferPairId == transferPairId && t.Id != transactionId, cancellationToken);
    }

    private static IOrderedQueryable<Transaction> OrderTransactions(IQueryable<Transaction> query)
    {
        return query
            .OrderByDescending(transaction => transaction.Date)
            .ThenByDescending(transaction => transaction.CreatedAt);
    }
}
