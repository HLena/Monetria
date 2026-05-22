namespace Monetria.Application.Accounts;

public interface IBalanceService
{
    Task<UserBalanceResponse> GetUserBalanceAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
