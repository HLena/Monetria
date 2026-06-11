namespace Monetria.Application.SavingsPockets;

public sealed record CreateSavingsPocketRequest(
    string Name,
    Guid? LinkedAccountId,
    string? Color,
    string? Description);

public sealed record UpdateSavingsPocketRequest(
    string Name,
    Guid? LinkedAccountId,
    string? Color,
    string? Description);

public sealed record AdjustSavingsPocketRequest(
    decimal Amount,
    string? Note);

public sealed record SavingsPocketResponse(
    Guid Id,
    Guid UserId,
    string Name,
    decimal CurrentAmount,
    Guid? LinkedAccountId,
    string? Color,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt);
