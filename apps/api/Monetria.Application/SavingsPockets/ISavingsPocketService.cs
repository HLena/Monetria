namespace Monetria.Application.SavingsPockets;

public interface ISavingsPocketService
{
    Task<SavingsPocketResponse> CreateAsync(Guid userId, CreateSavingsPocketRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SavingsPocketResponse>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<SavingsPocketResponse> UpdateAsync(Guid userId, Guid pocketId, UpdateSavingsPocketRequest request, CancellationToken cancellationToken = default);
    Task<SavingsPocketResponse> AdjustAmountAsync(Guid userId, Guid pocketId, AdjustSavingsPocketRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid pocketId, CancellationToken cancellationToken = default);
}
