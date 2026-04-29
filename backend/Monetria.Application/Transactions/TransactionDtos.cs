using Monetria.Domain.Enums;

namespace Monetria.Application.Transactions;

public sealed record CreateTransactionRequest(
    Guid AccountId,
    TransactionType Type,
    string Category,
    decimal Amount,
    string Description,
    DateTime Date);

public sealed record TransactionResponse(
    Guid Id,
    Guid AccountId,
    TransactionType Type,
    string Category,
    decimal Amount,
    string? Description,
    DateTime Date,
    DateTime CreatedAt);
