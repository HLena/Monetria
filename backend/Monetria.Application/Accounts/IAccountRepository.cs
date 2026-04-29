using Monetria.Domain.Entities;

namespace Monetria.Application.Accounts;

public interface IAccountRepository
{
    Task AddAsync(Account account, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Account>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
