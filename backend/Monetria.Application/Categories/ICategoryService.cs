using Monetria.Domain.Enums;

namespace Monetria.Application.Categories;

public interface ICategoryService
{
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategoryResponse>> ListByUserIdAsync(
        Guid userId,
        TransactionType? type = null,
        bool includeInactive = false,
        CancellationToken cancellationToken = default);

    Task<CategoryResponse> UpdateAsync(
        Guid categoryId,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<CategoryResponse> DeactivateAsync(
        Guid categoryId,
        DeactivateCategoryRequest request,
        CancellationToken cancellationToken = default);
}
