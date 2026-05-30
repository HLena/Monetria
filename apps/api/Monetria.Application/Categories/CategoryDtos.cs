using Monetria.Domain.Enums;

namespace Monetria.Application.Categories;

public sealed record CreateCategoryRequest(
    string Name,
    TransactionType Type,
    string? Color,
    string? KeyIcon = null);

public sealed record UpdateCategoryRequest(
    string Name,
    string? Color,
    string? KeyIcon = null);

public sealed record CategoryResponse(
    Guid Id,
    Guid? UserId,
    string Name,
    TransactionType Type,
    bool IsDefault,
    bool IsActive,
    string? Color,
    string? KeyIcon,
    DateTime CreatedAt,
    DateTime UpdatedAt);
