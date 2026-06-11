using Monetria.Domain.Entities;

namespace Monetria.Application.SavingsPockets;

public interface ISavingsPocketRepository
{
    Task AddAsync(SavingsPocket pocket, CancellationToken cancellationToken = default);
    Task<SavingsPocket?> GetByIdAsync(Guid pocketId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SavingsPocket>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
