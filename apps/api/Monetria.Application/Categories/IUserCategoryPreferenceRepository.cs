using Monetria.Domain.Entities;

namespace Monetria.Application.Categories;

public interface IUserCategoryPreferenceRepository
{
    Task<IReadOnlyList<UserCategoryPreference>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserCategoryPreference?> GetAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken = default);
    Task AddAsync(UserCategoryPreference preference, CancellationToken cancellationToken = default);
}
