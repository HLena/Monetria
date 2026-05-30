namespace Monetria.Application.Debts;

public sealed record CreateDebtRequest(
    string Name,
    string? Creditor,
    decimal OriginalAmount,
    decimal RemainingAmount,
    decimal InterestRate,
    decimal MinimumPayment,
    DateTime? NextPaymentDate,
    string? Type);

public sealed record UpdateDebtRequest(
    string Name,
    string? Creditor,
    decimal OriginalAmount,
    decimal RemainingAmount,
    decimal InterestRate,
    decimal MinimumPayment,
    DateTime? NextPaymentDate,
    string? Type);

public sealed record DebtResponse(
    Guid Id,
    Guid UserId,
    string Name,
    string? Creditor,
    decimal OriginalAmount,
    decimal RemainingAmount,
    decimal InterestRate,
    decimal MinimumPayment,
    DateTime? NextPaymentDate,
    string? Type);
