using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public interface IAccountService
{
    Task<AccountResponse> CreateAsync(Guid userId, CreateAccountRequest request, CancellationToken cancellationToken = default);

    Task<AccountResponse> GetByIdAsync(Guid userId, Guid accountId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AccountResponse>> ListByUserIdAsync(
        Guid userId,
        AccountType? type = null,
        CancellationToken cancellationToken = default);

    Task<AccountResponse> UpdateAsync(Guid userId, Guid accountId, UpdateAccountRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken = default);
}
