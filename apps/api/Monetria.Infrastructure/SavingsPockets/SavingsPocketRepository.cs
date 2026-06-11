using Microsoft.EntityFrameworkCore;
using Monetria.Application.SavingsPockets;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.SavingsPockets;

public sealed class SavingsPocketRepository(MonetriaDbContext dbContext) : ISavingsPocketRepository
{
    public async Task AddAsync(SavingsPocket pocket, CancellationToken cancellationToken = default)
    {
        await dbContext.SavingsPockets.AddAsync(pocket, cancellationToken);
    }

    public Task<SavingsPocket?> GetByIdAsync(Guid pocketId, CancellationToken cancellationToken = default)
    {
        return dbContext.SavingsPockets.FirstOrDefaultAsync(p => p.Id == pocketId, cancellationToken);
    }

    public async Task<IReadOnlyList<SavingsPocket>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.SavingsPockets
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.IsActive)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
