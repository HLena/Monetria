using Monetria.Application.Accounts;
using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.SavingsGoals;

public sealed class SavingsGoalService(
    ISavingsGoalRepository savingsGoalRepository,
    IAccountRepository accountRepository,
    IBalanceService balanceService,
    IUnitOfWork unitOfWork) : ISavingsGoalService
{
    public async Task<SavingsGoalResponse> CreateAsync(
        Guid userId,
        CreateSavingsGoalRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        if (request.LinkedAccountId.HasValue)
            await ValidateLinkedAccountAsync(userId, request.LinkedAccountId.Value, cancellationToken);

        var savingsGoal = new SavingsGoal
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = NormalizeRequired(request.Name, "Savings goal name is required."),
            TargetAmount = ValidateTargetAmount(request.TargetAmount),
            CurrentAmount = request.LinkedAccountId.HasValue ? 0 : ValidateCurrentAmount(request.CurrentAmount, request.TargetAmount),
            LinkedAccountId = request.LinkedAccountId,
            IsCompleted = false,
            TargetDate = request.TargetDate,
            Category = NormalizeOptional(request.Category),
            Color = NormalizeOptional(request.Color),
            Description = NormalizeOptional(request.Description)
        };

        await savingsGoalRepository.AddAsync(savingsGoal, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await BuildResponseAsync(savingsGoal, cancellationToken);
    }

    public async Task<IReadOnlyList<SavingsGoalResponse>> ListByUserIdAsync(
        Guid userId,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var savingsGoals = await savingsGoalRepository.ListByUserIdAsync(userId, includeInactive, cancellationToken);

        var responses = new List<SavingsGoalResponse>(savingsGoals.Count);
        foreach (var goal in savingsGoals)
            responses.Add(await BuildResponseAsync(goal, cancellationToken));

        return responses;
    }

    public async Task<SavingsGoalResponse> UpdateAsync(
        Guid userId,
        Guid savingsGoalId,
        UpdateSavingsGoalRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var savingsGoal = await GetUserSavingsGoalAsync(userId, savingsGoalId, cancellationToken);

        if (request.LinkedAccountId.HasValue)
            await ValidateLinkedAccountAsync(userId, request.LinkedAccountId.Value, cancellationToken);

        savingsGoal.Name = NormalizeRequired(request.Name, "Savings goal name is required.");
        savingsGoal.TargetAmount = ValidateTargetAmount(request.TargetAmount);
        savingsGoal.LinkedAccountId = request.LinkedAccountId;
        savingsGoal.CurrentAmount = request.LinkedAccountId.HasValue
            ? savingsGoal.CurrentAmount
            : ValidateCurrentAmount(request.CurrentAmount, request.TargetAmount);
        savingsGoal.TargetDate = request.TargetDate;
        savingsGoal.Category = NormalizeOptional(request.Category);
        savingsGoal.Color = NormalizeOptional(request.Color);
        savingsGoal.Description = NormalizeOptional(request.Description);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await BuildResponseAsync(savingsGoal, cancellationToken);
    }

    public async Task DeleteAsync(Guid userId, Guid savingsGoalId, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var savingsGoal = await GetUserSavingsGoalAsync(userId, savingsGoalId, cancellationToken);
        savingsGoal.IsActive = false;

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<SavingsGoalResponse> BuildResponseAsync(SavingsGoal goal, CancellationToken cancellationToken)
    {
        decimal currentAmount = goal.CurrentAmount;

        if (goal.LinkedAccountId.HasValue)
        {
            var account = await accountRepository.GetByIdAsync(goal.LinkedAccountId.Value, cancellationToken);
            if (account != null)
                currentAmount = await balanceService.GetAccountBalanceAsync(account, cancellationToken);
        }

        var isCompleted = currentAmount >= goal.TargetAmount;

        return new SavingsGoalResponse(
            goal.Id,
            goal.UserId,
            goal.Name,
            goal.TargetAmount,
            currentAmount,
            goal.LinkedAccountId,
            isCompleted,
            goal.TargetDate,
            goal.Category,
            goal.Color,
            goal.Description);
    }

    private async Task ValidateLinkedAccountAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{accountId}' was not found.");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("Account does not belong to the user.");
    }

    private async Task<SavingsGoal> GetUserSavingsGoalAsync(
        Guid userId,
        Guid savingsGoalId,
        CancellationToken cancellationToken)
    {
        if (savingsGoalId == Guid.Empty)
            throw new ArgumentException("Savings goal id is required.", nameof(savingsGoalId));

        var savingsGoal = await savingsGoalRepository.GetByIdAsync(savingsGoalId, cancellationToken)
            ?? throw new NotFoundException($"Savings goal '{savingsGoalId}' was not found.");

        if (savingsGoal.UserId != userId)
            throw new UnauthorizedAccessException("Savings goal does not belong to the user.");

        return savingsGoal;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));
    }

    private static decimal ValidateTargetAmount(decimal targetAmount)
    {
        if (targetAmount <= 0)
            throw new ArgumentException("Savings goal target amount must be greater than 0.", nameof(targetAmount));

        return targetAmount;
    }

    private static decimal ValidateCurrentAmount(decimal currentAmount, decimal targetAmount)
    {
        if (currentAmount < 0)
            throw new ArgumentException("Savings goal current amount cannot be negative.", nameof(currentAmount));

        if (targetAmount > 0 && currentAmount > targetAmount)
            throw new ArgumentException("Savings goal current amount cannot exceed target amount.", nameof(currentAmount));

        return currentAmount;
    }

    private static string NormalizeRequired(string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException(message, nameof(value));

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
