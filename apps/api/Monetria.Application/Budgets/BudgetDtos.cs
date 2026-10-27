namespace Monetria.Application.Budgets;

public sealed record CreateBudgetRequest(
    Guid CategoryId,
    decimal LimitAmount,
    int Month,
    int Year,
    bool IsRecurring = false);

public sealed record UpdateBudgetRequest(
    Guid CategoryId,
    decimal LimitAmount,
    int Month,
    int Year,
    bool IsRecurring = false);

public sealed record BudgetResponse(
    Guid Id,
    Guid UserId,
    Guid CategoryId,
    decimal LimitAmount,
    int Month,
    int Year,
    bool IsRecurring,
    decimal SpentAmount,
    DateTime CreatedAt);
