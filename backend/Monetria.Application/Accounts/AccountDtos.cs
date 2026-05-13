using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public sealed record CreateAccountRequest(
    string? Name,
    AccountType Type,
    decimal InitialBalance,
    string Currency,
    string? InstitutionName,
    string? CardHolderName,
    string? CardLast4Digits,
    decimal? CreditLimit,
    int? BillingDate,
    int? PaymentDay,
    string? ProviderName,
    string? ColorCode);

public sealed record AccountResponse(
    Guid Id,
    Guid UserId,
    string? Name,
    AccountType Type,
    decimal InitialBalance,
    string CurrencyCode,
    string? InstitutionName,
    string? CardLast4Digits,
    decimal? CreditLimit,
    bool IsActive,
    string ColorCode,
    DateTime CreatedAt,
    DateTime UpdatedAt);
