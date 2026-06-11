using Microsoft.EntityFrameworkCore;
using Monetria.Application.Recurrings;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.Recurrings;

public sealed class RecurringOccurrenceRepository(MonetriaDbContext dbContext) : IRecurringOccurrenceRepository
{
    public async Task AddAsync(RecurringOccurrence occurrence, CancellationToken cancellationToken = default)
    {
        await dbContext.RecurringOccurrences.AddAsync(occurrence, cancellationToken);
    }

    public Task<RecurringOccurrence?> GetByIdAsync(Guid occurrenceId, CancellationToken cancellationToken = default)
    {
        return dbContext.RecurringOccurrences
            .Include(o => o.Recurring)
            .FirstOrDefaultAsync(o => o.Id == occurrenceId, cancellationToken);
    }

    public async Task<IReadOnlyList<RecurringOccurrence>> ListByRecurringIdAsync(
        Guid recurringId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.RecurringOccurrences
            .AsNoTracking()
            .Where(o => o.RecurringId == recurringId)
            .OrderBy(o => o.ScheduledDate)
            .ToListAsync(cancellationToken);
    }
}
