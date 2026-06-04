namespace Monetria.Application.Debts;

public interface IDebtService
{
    Task<DebtResponse> CreateAsync(Guid userId, CreateDebtRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DebtResponse>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<DebtResponse> UpdateAsync(Guid userId, Guid debtId, UpdateDebtRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid debtId, CancellationToken cancellationToken = default);
    Task<DebtResponse> PayAsync(Guid userId, Guid debtId, PayDebtRequest request, CancellationToken cancellationToken = default);
}
