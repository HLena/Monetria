using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Categories;

public interface ICategoryRepository
{
    Task AddAsync(Category category, CancellationToken cancellationToken = default);

    Task<Category?> GetByIdAsync(Guid categoryId, CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameAsync(
        Guid userId,
        TransactionType type,
        string name,
        Guid? excludedCategoryId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Category>> ListByUserIdAsync(
        Guid userId,
        TransactionType? type = null,
        bool includeInactive = false,
        CancellationToken cancellationToken = default);
}
