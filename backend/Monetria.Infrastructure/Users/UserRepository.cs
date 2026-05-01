using Monetria.Application.Users;
using Monetria.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Users;

public sealed class UserRepository(MonetriaDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return dbContext.Users.FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLower();
        return dbContext.Users.FirstOrDefaultAsync(user => user.Email.ToLower() == normalizedEmail, cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await dbContext.Users.AddAsync(user, cancellationToken);
    }

    public Task<bool> ExistsUserWithEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLower();
        return dbContext.Users.AnyAsync(user => user.Email.ToLower() == normalizedEmail, cancellationToken);
    }
}
