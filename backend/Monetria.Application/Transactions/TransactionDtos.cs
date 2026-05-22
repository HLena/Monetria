using Monetria.Domain.Enums;

namespace Monetria.Application.Transactions;

public sealed record CreateTransactionRequest(
    Guid AccountId,
    TransactionType Type,
    Guid? CategoryId,
    decimal Amount,
    string? Description,
    DateTime Date,
    Guid? TransferAccountId = null);

public sealed record UpdateTransactionRequest(
    decimal Amount,
    Guid? CategoryId,
    DateTime TransactionDate,
    string? Description,
    Guid AccountId);

public sealed record TransactionResponse(
    Guid Id,
    Guid AccountId,
    TransactionType Type,
    Guid? CategoryId,
    string CategoryName,
    string? CategoryColor,
    string? CategoryKeyIcon,
    decimal Amount,
    string? Description,
    Guid? TransferAccountId,
    bool IsActive,
    DateTime Date,
    DateTime CreatedAt);

public sealed record TransactionFilterRequest(
    string? Description = null,
    TransactionType? Type = null,
    Guid? CategoryId = null,
    int? Month = null,
    int? Year = null,
    Guid? AccountId = null);
