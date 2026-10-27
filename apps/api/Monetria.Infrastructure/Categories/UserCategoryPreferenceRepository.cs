using Microsoft.EntityFrameworkCore;
using Monetria.Application.Categories;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Categories;

public sealed class UserCategoryPreferenceRepository(MonetriaDbContext dbContext) : IUserCategoryPreferenceRepository
{
    public async Task<IReadOnlyList<UserCategoryPreference>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.UserCategoryPreferences
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public Task<UserCategoryPreference?> GetAsync(
        Guid userId,
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        return dbContext.UserCategoryPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.CategoryId == categoryId, cancellationToken);
    }

    public async Task AddAsync(UserCategoryPreference preference, CancellationToken cancellationToken = default)
    {
        await dbContext.UserCategoryPreferences.AddAsync(preference, cancellationToken);
    }
}
