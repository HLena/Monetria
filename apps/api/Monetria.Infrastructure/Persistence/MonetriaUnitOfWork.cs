using Monetria.Application.Common;

namespace Monetria.Infrastructure.Persistence;

public sealed class MonetriaUnitOfWork(MonetriaDbContext dbContext) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
