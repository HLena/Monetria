namespace Monetria.Application.Debts;

public sealed record CreateDebtRequest(
    string Name,
    string? Creditor,
    decimal OriginalAmount,
    decimal RemainingAmount,
    decimal InterestRate,
    decimal MinimumPayment,
    DateTime? NextPaymentDate,
    string? Type,
    Guid? AccountId = null,
    Guid? CategoryId = null);

public sealed record UpdateDebtRequest(
    string Name,
    string? Creditor,
    decimal OriginalAmount,
    decimal RemainingAmount,
    decimal InterestRate,
    decimal MinimumPayment,
    DateTime? NextPaymentDate,
    string? Type,
    Guid? AccountId = null,
    Guid? CategoryId = null);

public sealed record PayDebtRequest(decimal Amount);

public sealed record DebtResponse(
    Guid Id,
    Guid UserId,
    Guid? AccountId,
    Guid? CategoryId,
    string Name,
    string? Creditor,
    decimal OriginalAmount,
    decimal RemainingAmount,
    decimal InterestRate,
    decimal MinimumPayment,
    DateTime? NextPaymentDate,
    string? Type,
    bool IsActive);
