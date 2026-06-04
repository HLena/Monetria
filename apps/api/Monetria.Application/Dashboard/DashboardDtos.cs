using Monetria.Application.Transactions;
using Monetria.Domain.Enums;

namespace Monetria.Application.Dashboard;

public sealed record DashboardResponse(
    decimal NetWorth,
    MonthSummary CurrentMonth,
    IReadOnlyList<AccountBalanceEntry> Accounts,
    IReadOnlyList<TransactionResponse> RecentTransactions,
    IReadOnlyList<BudgetSummaryEntry> Budgets,
    IReadOnlyList<UpcomingRecurringEntry> UpcomingRecurrings);

public sealed record MonthSummary(
    int Month,
    int Year,
    decimal Income,
    decimal Expenses,
    decimal Balance);

public sealed record AccountBalanceEntry(
    Guid Id,
    string? Name,
    AccountType Type,
    decimal Balance,
    string CurrencyCode,
    string ColorCode,
    string? InstitutionName);

public sealed record BudgetSummaryEntry(
    Guid Id,
    Guid CategoryId,
    decimal LimitAmount,
    decimal SpentAmount,
    int Month,
    int Year,
    bool RolloverUnused);

public sealed record UpcomingRecurringEntry(
    Guid Id,
    string Name,
    TransactionType Type,
    RecurringAmountType AmountType,
    decimal? Amount,
    decimal? EstimatedAmount,
    RecurringFrequency Frequency,
    DateOnly NextDueDate,
    Guid? CategoryId,
    string? CategoryName);
