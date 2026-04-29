namespace Monetria.Application.Accounts;

public interface IAccountService
{
    Task<AccountResponse> CreateAsync(CreateAccountRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AccountResponse>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
