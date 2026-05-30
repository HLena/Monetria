namespace Monetria.Application.FixedExpenses;

public interface IFixedExpenseService
{
    Task<FixedExpenseResponse> CreateAsync(Guid userId, CreateFixedExpenseRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FixedExpenseResponse>> ListByUserIdAsync(Guid userId, bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<FixedExpenseResponse> UpdateAsync(Guid userId, Guid fixedExpenseId, UpdateFixedExpenseRequest request, CancellationToken cancellationToken = default);
    Task<FixedExpenseResponse> DeactivateAsync(Guid userId, Guid fixedExpenseId, CancellationToken cancellationToken = default);
}
