namespace Monetria.Application.Budgets;

public sealed record CreateBudgetRequest(
    Guid CategoryId,
    decimal LimitAmount,
    int Month,
    int Year,
    bool RolloverUnused = false);

public sealed record UpdateBudgetRequest(
    Guid CategoryId,
    decimal LimitAmount,
    int Month,
    int Year,
    bool RolloverUnused = false);

public sealed record BudgetResponse(
    Guid Id,
    Guid UserId,
    Guid CategoryId,
    decimal LimitAmount,
    int Month,
    int Year,
    bool RolloverUnused,
    decimal SpentAmount,
    DateTime CreatedAt);
