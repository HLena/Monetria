namespace Monetria.Application.SavingsGoals;

public interface ISavingsGoalService
{
    Task<SavingsGoalResponse> CreateAsync(Guid userId, CreateSavingsGoalRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SavingsGoalResponse>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<SavingsGoalResponse> UpdateAsync(Guid userId, Guid savingsGoalId, UpdateSavingsGoalRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid savingsGoalId, CancellationToken cancellationToken = default);
}
