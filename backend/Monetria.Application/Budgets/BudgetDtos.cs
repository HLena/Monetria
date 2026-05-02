using Monetria.Domain.Enums;

namespace Monetria.Application.Budgets;

public sealed record CreateBudgetRequest(
    string Category,
    decimal LimitAmount,
    BudgetPeriod Period);

public sealed record UpdateBudgetRequest(
    string Category,
    decimal LimitAmount,
    BudgetPeriod Period);

public sealed record BudgetResponse(
    Guid Id,
    Guid UserId,
    string Category,
    decimal LimitAmount,
    BudgetPeriod Period,
    DateTime CreatedAt);
