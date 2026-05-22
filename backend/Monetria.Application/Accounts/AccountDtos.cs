using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public sealed record CreateAccountRequest(
    string? Name,
    AccountType Type,
    decimal InitialBalance,
    string CurrencyCode,
    string? InstitutionName,
    string? CardHolderName,
    string? CardLast4Digits,
    decimal? CreditLimit,
    int? StatementClosingDay,
    int? PaymentDueDay,
    string? ColorCode);

public sealed record UpdateAccountRequest(
    string? Name,
    string? CurrencyCode,
    string? InstitutionName,
    string? CardHolderName,
    string? CardLast4Digits,
    decimal? CreditLimit,
    int? StatementClosingDay,
    int? PaymentDueDay,
    string? ColorCode,
    bool? IsActive = null);

public sealed record AccountResponse(
    Guid Id,
    Guid UserId,
    string? Name,
    AccountType Type,
    decimal CurrentBalance,
    string CurrencyCode,
    string? InstitutionName,
    string? CardLast4Digits,
    decimal? CreditLimit,
    string? CardHolderName,
    int? StatementClosingDay,
    int? PaymentDueDay,
    bool IsActive,
    string ColorCode,
    DateTime CreatedAt,
    DateTime UpdatedAt);
