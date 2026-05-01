using Monetria.Domain.Entities;

namespace Monetria.Application.Users;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    Task<bool> ExistsUserWithEmailAsync(string email, CancellationToken cancellationToken = default);
}