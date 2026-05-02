using Microsoft.EntityFrameworkCore;
using Monetria.Application.Categories;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Categories;

public sealed class CategoryRepository(MonetriaDbContext dbContext) : ICategoryRepository
{
    public async Task AddAsync(Category category, CancellationToken cancellationToken = default)
    {
        await dbContext.Categories.AddAsync(category, cancellationToken);
    }

    public Task<Category?> GetByIdAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        return dbContext.Categories
            .FirstOrDefaultAsync(category => category.Id == categoryId, cancellationToken);
    }

    public Task<bool> ExistsByNameAsync(
        Guid userId,
        TransactionType type,
        string name,
        Guid? excludedCategoryId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedName = name.Trim().ToLowerInvariant();

        return dbContext.Categories.AnyAsync(
            category =>
                (category.IsDefault || category.UserId == userId)
                && category.Type == type
                && category.Name.ToLower() == normalizedName
                && (!excludedCategoryId.HasValue || category.Id != excludedCategoryId.Value),
            cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> ListByUserIdAsync(
        Guid userId,
        TransactionType? type = null,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Categories
            .AsNoTracking()
            .Where(category => category.IsDefault || category.UserId == userId);

        if (type.HasValue)
        {
            query = query.Where(category => category.Type == type.Value);
        }

        if (!includeInactive)
        {
            query = query.Where(category => category.IsActive);
        }

        return await query
            .OrderByDescending(category => category.IsDefault)
            .ThenBy(category => category.Type)
            .ThenBy(category => category.Name)
            .ToListAsync(cancellationToken);
    }
}
