using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public interface IAccountService
{
    Task<AccountDetailResponse> CreateAsync(Guid userId, CreateAccountRequest request, CancellationToken cancellationToken = default);

    Task<AccountDetailResponse> GetByIdAsync(Guid userId, Guid accountId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AccountSummaryResponse>> ListByUserIdAsync(
        Guid userId,
        AccountType? type = null,
        CancellationToken cancellationToken = default);

    Task<AccountDetailResponse> UpdateAsync(Guid userId, Guid accountId, UpdateAccountRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken = default);
}
