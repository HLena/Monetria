using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public sealed record CreateAccountRequest(
    Guid UserId,
    string? Name,
    AccountType Type,
    decimal InitialBalance,
    string Currency,
    string? Bank,
    string? CardHolderName,
    string? CardLast4Digits,
    string? ExpiryDate,
    decimal? CreditLimit,
    int? BillingDate,
    int? PaymentDay);

public sealed record AccountResponse(
    Guid Id,
    Guid UserId,
    string? Name,
    AccountType Type,
    decimal InitialBalance,
    string Currency,
    string? Bank,
    string? CardLast4Digits,
    decimal? CreditLimit,
    DateTime CreatedAt);
