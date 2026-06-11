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
        RecurringFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        return await BuildQuery(userId, filter)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountByUserIdAsync(
        Guid userId,
        RecurringFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        return BuildQuery(userId, filter).CountAsync(cancellationToken);
    }

    private IQueryable<Recurring> BuildQuery(Guid userId, RecurringFilterRequest filter)
    {
        var query = dbContext.Recurrings
            .AsNoTracking()
            .Include(r => r.Category)
            .Where(r => r.UserId == userId);

        if (!filter.IncludeInactive)
            query = query.Where(r => r.IsActive);

        return query.OrderBy(r => r.NextDueDate).ThenBy(r => r.Name);
    }
}
