using Monetria.Domain.Enums;

namespace Monetria.Application.Transactions;

public sealed record CreateTransactionRequest(
    Guid FromAccountId,
    TransactionType Type,
    Guid? CategoryId,
    decimal Amount,
    string? Description,
    DateTime Date,
    Guid? ToAccountId = null,
    string CurrencyCode = "PEN");

public sealed record UpdateTransactionRequest(
    decimal Amount,
    Guid? CategoryId,
    DateTime TransactionDate,
    string? Description,
    Guid FromAccountId,
    string CurrencyCode = "PEN");

public sealed record TransactionResponse(
    Guid Id,
    Guid FromAccountId,
    TransactionType Type,
    Guid? CategoryId,
    string CategoryName,
    string? CategoryColor,
    string? CategoryKeyIcon,
    decimal Amount,
    string? Description,
    Guid? ToAccountId,
    Guid? TransferPairId,
    bool IsActive,
    string CurrencyCode,
    DateTime Date,
    DateTime CreatedAt);

public sealed record TransactionFilterRequest(
    string? Description = null,
    TransactionType? Type = null,
    Guid? CategoryId = null,
    int? Month = null,
    int? Year = null,
    Guid? FromAccountId = null,
    int? Limit = null,
    int? Page = null,
    int? PageSize = null,
    string? StartDate = null,
    string? EndDate = null);

public sealed record TransactionSummaryResponse(
    decimal TotalIncome,
    decimal TotalExpenses,
    int TotalCount);

// ── Reports ───────────────────────────────────────────────────────────────────

public sealed record FlowEntry(string Label, decimal Income, decimal Expenses);

public sealed record MonthlyFlowResponse(
    int Months,
    string Granularity,
    IReadOnlyList<FlowEntry> Data);

public sealed record CategorySpendingEntry(
    Guid? CategoryId,
    string CategoryName,
    string? Color,
    string? KeyIcon,
    decimal Amount,
    decimal Percentage);

public sealed record SpendingByCategoryResponse(
    int Months,
    string PeriodStart,
    string PeriodEnd,
    decimal TotalExpenses,
    IReadOnlyList<CategorySpendingEntry> Data);

// Raw types used between repository and service (not exposed to API)
public sealed record MonthFlowPoint(int Month, int Year, decimal Income, decimal Expenses);
public sealed record WeekFlowPoint(int WeekOfMonth, decimal Income, decimal Expenses);
public sealed record CategorySpendingPoint(Guid? CategoryId, string? CategoryName, string? Color, string? KeyIcon, decimal Amount);
