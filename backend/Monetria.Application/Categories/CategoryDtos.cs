using Monetria.Domain.Enums;

namespace Monetria.Application.Categories;

public sealed record CreateCategoryRequest(
    string Name,
    TransactionType Type,
    string? Color);

public sealed record UpdateCategoryRequest(
    string Name,
    string? Color);

public sealed record CategoryResponse(
    Guid Id,
    Guid? UserId,
    string Name,
    TransactionType Type,
    bool IsDefault,
    bool IsActive,
    string? Color,
    DateTime CreatedAt,
    DateTime UpdatedAt);
