using System.Globalization;
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
        var query = BuildUserQuery(userId, filter);
        var ordered = OrderTransactions(query);

        if (filter.Limit.HasValue)
            return await ordered.Take(filter.Limit.Value).ToListAsync(cancellationToken);

        if (filter.Page.HasValue && filter.PageSize.HasValue)
        {
            var skip = (filter.Page.Value - 1) * filter.PageSize.Value;
            return await ordered.Skip(skip).Take(filter.PageSize.Value).ToListAsync(cancellationToken);
        }

        return await ordered.ToListAsync(cancellationToken);
    }

    public async Task<int> CountByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        return await BuildUserQuery(userId, filter).CountAsync(cancellationToken);
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

        var ordered = OrderTransactions(query);
        return filter.Limit.HasValue
            ? await ordered.Take(filter.Limit.Value).ToListAsync(cancellationToken)
            : await ordered.ToListAsync(cancellationToken);
    }

    public async Task<Transaction?> GetTransferPairAsync(Guid transactionId, Guid transferPairId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Transactions
            .FirstOrDefaultAsync(t => t.TransferPairId == transferPairId && t.Id != transactionId, cancellationToken);
    }

    public async Task<TransactionSummaryResponse> GetSummaryByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        var filteredQuery = BuildUserQuery(userId, filter);

        var totalIncome = await filteredQuery
            .Where(t => t.Type == TransactionType.Income)
            .SumAsync(t => t.Amount, cancellationToken);

        var totalExpenses = await filteredQuery
            .Where(t => t.Type == TransactionType.Expense)
            .SumAsync(t => t.Amount, cancellationToken);

        var totalCount = await filteredQuery.CountAsync(cancellationToken);

        return new TransactionSummaryResponse(totalIncome, totalExpenses, totalCount);
    }

    public async Task<IReadOnlyList<MonthFlowPoint>> GetMonthlyFlowAsync(
        Guid userId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default)
    {
        var userAccountIds = dbContext.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id);

        var raw = await dbContext.Transactions
            .AsNoTracking()
            .Where(t => t.IsActive
                && userAccountIds.Contains(t.FromAccountId)
                && t.Type != TransactionType.Transfer
                && t.Date >= periodStart && t.Date < periodEnd)
            .GroupBy(t => new { t.Date.Year, t.Date.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Income   = g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                Expenses = g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount),
            })
            .ToListAsync(cancellationToken);

        return raw.Select(x => new MonthFlowPoint(x.Month, x.Year, x.Income, x.Expenses)).ToList();
    }

    public async Task<IReadOnlyList<WeekFlowPoint>> GetWeeklyFlowAsync(
        Guid userId, int month, int year, CancellationToken cancellationToken = default)
    {
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end   = start.AddMonths(1);

        var userAccountIds = dbContext.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id);

        var transactions = await dbContext.Transactions
            .AsNoTracking()
            .Where(t => t.IsActive
                && userAccountIds.Contains(t.FromAccountId)
                && t.Type != TransactionType.Transfer
                && t.Date >= start && t.Date < end)
            .Select(t => new { t.Date.Day, t.Type, t.Amount })
            .ToListAsync(cancellationToken);

        return transactions
            .GroupBy(t => (t.Day - 1) / 7 + 1)
            .OrderBy(g => g.Key)
            .Select(g => new WeekFlowPoint(
                g.Key,
                g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)))
            .ToList();
    }

    public async Task<IReadOnlyList<CategorySpendingPoint>> GetSpendingByCategoryAsync(
        Guid userId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default)
    {
        var userAccountIds = dbContext.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id);

        var grouped = await dbContext.Transactions
            .AsNoTracking()
            .Where(t => t.IsActive
                && userAccountIds.Contains(t.FromAccountId)
                && t.Type == TransactionType.Expense
                && t.Date >= periodStart && t.Date < periodEnd)
            .GroupBy(t => t.CategoryId)
            .Select(g => new { CategoryId = g.Key, Amount = g.Sum(t => t.Amount) })
            .ToListAsync(cancellationToken);

        var categoryIds = grouped
            .Where(g => g.CategoryId.HasValue)
            .Select(g => g.CategoryId!.Value)
            .Distinct()
            .ToList();

        var categories = await dbContext.Categories
            .AsNoTracking()
            .Where(c => categoryIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Name, c.Color, c.KeyIcon })
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        return grouped
            .Select(g =>
            {
                var cat = g.CategoryId.HasValue && categories.TryGetValue(g.CategoryId.Value, out var c) ? c : null;
                return new CategorySpendingPoint(
                    g.CategoryId,
                    cat?.Name ?? "Sin categoría",
                    cat?.Color,
                    cat?.KeyIcon,
                    g.Amount);
            })
            .OrderByDescending(x => x.Amount)
            .ToList();
    }

    private IQueryable<Transaction> BuildUserQuery(Guid userId, TransactionFilterRequest filter)
    {
        var userAccountIds = dbContext.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id);

        var query = dbContext.Transactions
            .AsNoTracking()
            .Include(transaction => transaction.Category)
            .Where(transaction => transaction.IsActive && userAccountIds.Contains(transaction.FromAccountId));

        return ApplyFilters(query, filter);
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
            query = query.Where(transaction => transaction.Type == filter.Type.Value);

        if (filter.CategoryId.HasValue)
            query = query.Where(transaction => transaction.CategoryId == filter.CategoryId.Value);

        if (filter.FromAccountId.HasValue)
            query = query.Where(transaction => transaction.FromAccountId == filter.FromAccountId.Value);

        if (filter.Month.HasValue)
        {
            var startDate = new DateTime(filter.Year!.Value, filter.Month.Value, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);
            query = query.Where(transaction => transaction.Date >= startDate && transaction.Date < endDate);
        }
        else if (filter.Year.HasValue)
        {
            var startDate = new DateTime(filter.Year.Value, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddYears(1);
            query = query.Where(transaction => transaction.Date >= startDate && transaction.Date < endDate);
        }
        else
        {
            Console.Error.WriteLine($"[DateFilter] StartDate='{filter.StartDate}' EndDate='{filter.EndDate}'");

            if (!string.IsNullOrEmpty(filter.StartDate) &&
                DateOnly.TryParseExact(filter.StartDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var startDateOnly))
            {
                var start = new DateTime(startDateOnly.Year, startDateOnly.Month, startDateOnly.Day, 0, 0, 0, DateTimeKind.Utc);
                Console.Error.WriteLine($"[DateFilter] Applying start >= {start:O}");
                query = query.Where(transaction => transaction.Date >= start);
            }
            else if (!string.IsNullOrEmpty(filter.StartDate))
            {
                Console.Error.WriteLine($"[DateFilter] FAILED to parse StartDate: '{filter.StartDate}'");
            }

            if (!string.IsNullOrEmpty(filter.EndDate) &&
                DateOnly.TryParseExact(filter.EndDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var endDateOnly))
            {
                var nextDay = endDateOnly.AddDays(1);
                var end = new DateTime(nextDay.Year, nextDay.Month, nextDay.Day, 0, 0, 0, DateTimeKind.Utc);
                Console.Error.WriteLine($"[DateFilter] Applying end < {end:O}");
                query = query.Where(transaction => transaction.Date < end);
            }
            else if (!string.IsNullOrEmpty(filter.EndDate))
            {
                Console.Error.WriteLine($"[DateFilter] FAILED to parse EndDate: '{filter.EndDate}'");
            }
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
