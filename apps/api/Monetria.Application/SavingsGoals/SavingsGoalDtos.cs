namespace Monetria.Application.SavingsGoals;

public sealed record CreateSavingsGoalRequest(
    string Name,
    decimal TargetAmount,
    decimal CurrentAmount,
    Guid? LinkedAccountId,
    DateTime? TargetDate,
    string? Category,
    string? Color,
    string? Description);

public sealed record UpdateSavingsGoalRequest(
    string Name,
    decimal TargetAmount,
    decimal CurrentAmount,
    Guid? LinkedAccountId,
    DateTime? TargetDate,
    string? Category,
    string? Color,
    string? Description);

public sealed record SavingsGoalResponse(
    Guid Id,
    Guid UserId,
    string Name,
    decimal TargetAmount,
    decimal CurrentAmount,
    Guid? LinkedAccountId,
    bool IsCompleted,
    DateTime? TargetDate,
    string? Category,
    string? Color,
    string? Description);
