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
    int? PageSize = null);

public sealed record TransactionSummaryResponse(
    decimal TotalIncome,
    decimal TotalExpenses,
    int TotalCount);
