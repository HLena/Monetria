using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public interface IAccountRepository
{
    Task AddAsync(Account account, CancellationToken cancellationToken = default);
    Task<Account?> GetByIdAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Account>> ListByUserIdAsync(
        Guid userId,
        AccountType? type = null,
        CancellationToken cancellationToken = default);
}
