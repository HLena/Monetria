using Microsoft.EntityFrameworkCore;
using Monetria.Application.SavingsGoals;
using Monetria.Domain.Entities;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Infrastructure.SavingsGoals;

public sealed class SavingsGoalRepository(MonetriaDbContext dbContext) : ISavingsGoalRepository
{
    public async Task AddAsync(SavingsGoal savingsGoal, CancellationToken cancellationToken = default)
    {
        await dbContext.SavingsGoals.AddAsync(savingsGoal, cancellationToken);
    }

    public Task<SavingsGoal?> GetByIdAsync(Guid savingsGoalId, CancellationToken cancellationToken = default)
    {
        return dbContext.SavingsGoals.FirstOrDefaultAsync(goal => goal.Id == savingsGoalId, cancellationToken);
    }

    public async Task<IReadOnlyList<SavingsGoal>> ListByUserIdAsync(
        Guid userId,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.SavingsGoals
            .AsNoTracking()
            .Where(goal => goal.UserId == userId);

        if (!includeInactive)
            query = query.Where(goal => goal.IsActive);

        return await query
            .OrderBy(goal => goal.TargetDate)
            .ThenBy(goal => goal.Name)
            .ToListAsync(cancellationToken);
    }

}
