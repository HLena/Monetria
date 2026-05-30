using Monetria.Domain.Enums;

namespace Monetria.Application.FixedExpenses;

public sealed record CreateFixedExpenseRequest(
    Guid AccountId,
    string Name,
    decimal Amount,
    string Category,
    ExpensePeriod Period,
    int? DueDay,
    string? Notes);

public sealed record UpdateFixedExpenseRequest(
    Guid AccountId,
    string Name,
    decimal Amount,
    string Category,
    ExpensePeriod Period,
    int? DueDay,
    bool IsActive,
    string? Notes);

public sealed record FixedExpenseResponse(
    Guid Id,
    Guid UserId,
    Guid AccountId,
    string Name,
    decimal Amount,
    string Category,
    ExpensePeriod Period,
    int? DueDay,
    bool IsActive,
    string? Notes);
