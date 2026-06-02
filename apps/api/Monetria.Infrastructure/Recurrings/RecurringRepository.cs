using Microsoft.EntityFrameworkCore;
using Monetria.Application.Recurrings;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Recurrings;

public sealed class RecurringRepository(MonetriaDbContext dbContext) : IRecurringRepository
{
    public Task AddAsync(Recurring recurring, CancellationToken cancellationToken = default)
    {
        dbContext.Recurrings.Add(recurring);
        return Task.CompletedTask;
    }

    public Task<Recurring?> GetByIdAsync(Guid recurringId, CancellationToken cancellationToken = default)
    {
        return dbContext.Recurrings
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == recurringId, cancellationToken);
    }

    public async Task<IReadOnlyList<Recurring>> ListByUserIdAsync(
        Guid userId,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Recurrings
            .AsNoTracking()
            .Include(r => r.Category)
            .Where(r => r.UserId == userId);

        if (!includeInactive)
            query = query.Where(r => r.IsActive);

        return await query
            .OrderBy(r => r.NextDueDate)
            .ThenBy(r => r.Name)
            .ToListAsync(cancellationToken);
    }
}
