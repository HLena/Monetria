using Monetria.Application.Accounts;
using Monetria.Application.Budgets;
using Monetria.Application.Recurrings;
using Monetria.Application.Transactions;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Dashboard;

public sealed class DashboardService(
    IAccountRepository accountRepository,
    ITransactionRepository transactionRepository,
    IBudgetRepository budgetRepository,
    IRecurringRepository recurringRepository) : IDashboardService
{
    public async Task<DashboardResponse> GetDashboardAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        var now = DateTime.UtcNow;
        var month = now.Month;
        var year = now.Year;

        var accounts = await accountRepository.ListByUserIdAsync(userId, null, cancellationToken);
        var activeAccounts = accounts.Where(a => a.IsActive).ToList();

        var accountEntries = new List<AccountBalanceEntry>(activeAccounts.Count);
        var netWorth = 0m;
        foreach (var account in activeAccounts)
        {
            var delta = await transactionRepository.GetAccountBalanceDeltaAsync(account.Id, cancellationToken);
            var balance = account.InitialBalance.GetValueOrDefault(0) + delta;
            netWorth += balance;
            accountEntries.Add(MapAccountEntry(account, balance));
        }

        var monthFilter = new TransactionFilterRequest(Month: month, Year: year);
        var monthTransactions = await transactionRepository.ListByUserIdAsync(userId, monthFilter, cancellationToken);
        var monthIncome = monthTransactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var monthExpenses = monthTransactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        var recentFilter = new TransactionFilterRequest(Limit: 10);
        var recentTransactions = await transactionRepository.ListByUserIdAsync(userId, recentFilter, cancellationToken);

        var allBudgets = await budgetRepository.ListByUserIdAsync(userId, cancellationToken);
        var currentBudgets = allBudgets.Where(b => b.Month == month && b.Year == year).ToList();

        var budgetEntries = new List<BudgetSummaryEntry>(currentBudgets.Count);
        foreach (var budget in currentBudgets)
        {
            var spent = await budgetRepository.GetSpentAmountAsync(
                userId, budget.CategoryId, budget.Month, budget.Year, cancellationToken);
            budgetEntries.Add(new BudgetSummaryEntry(
                budget.Id, budget.CategoryId, budget.LimitAmount, spent,
                budget.Month, budget.Year, budget.RolloverUnused));
        }

        var recurrings = await recurringRepository.ListByUserIdAsync(userId, false, cancellationToken);
        var cutoff = DateOnly.FromDateTime(now.AddDays(7));
        var upcomingRecurrings = recurrings
            .Where(r => r.NextDueDate <= cutoff)
            .Select(MapRecurringEntry)
            .ToList();

        return new DashboardResponse(
            netWorth,
            new MonthSummary(month, year, monthIncome, monthExpenses, monthIncome - monthExpenses),
            accountEntries,
            recentTransactions.Select(MapTransactionResponse).ToList(),
            budgetEntries,
            upcomingRecurrings);
    }

    private static AccountBalanceEntry MapAccountEntry(Account account, decimal balance) =>
        new(account.Id,
            account.Name,
            account.Type,
            balance,
            account.CurrencyCode,
            account.ColorCode,
            account.InstitutionName);

    private static TransactionResponse MapTransactionResponse(Transaction t) =>
        new(t.Id,
            t.FromAccountId,
            t.Type,
            t.CategoryId,
            t.Category?.Name ?? string.Empty,
            t.Category?.Color,
            t.Category?.KeyIcon,
            t.Amount,
            t.Description,
            t.ToAccountId,
            t.TransferPairId,
            t.IsActive,
            t.Date,
            t.CreatedAt);

    private static UpcomingRecurringEntry MapRecurringEntry(Recurring r) =>
        new(r.Id,
            r.Name,
            r.Type,
            r.AmountType,
            r.Amount,
            r.EstimatedAmount,
            r.Frequency,
            r.NextDueDate,
            r.CategoryId,
            r.Category?.Name);
}
