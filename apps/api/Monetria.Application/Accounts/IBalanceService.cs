namespace Monetria.Application.Accounts;

public interface IBalanceService
{
    Task<UserBalanceResponse> GetUserBalanceAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
    Task<decimal> GetAccountBalanceAsync(          // ← NUEVO
        Monetria.Domain.Entities.Account account,
        CancellationToken cancellationToken = default);
}
