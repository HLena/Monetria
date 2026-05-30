using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.SavingsGoals;

public sealed class SavingsGoalService(
    ISavingsGoalRepository savingsGoalRepository,
    IUnitOfWork unitOfWork) : ISavingsGoalService
{
    public async Task<SavingsGoalResponse> CreateAsync(
        Guid userId,
        CreateSavingsGoalRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var savingsGoal = new SavingsGoal
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = NormalizeRequired(request.Name, "Savings goal name is required."),
            TargetAmount = ValidateTargetAmount(request.TargetAmount),
            CurrentAmount = ValidateCurrentAmount(request.CurrentAmount, request.TargetAmount),
            TargetDate = request.TargetDate,
            Category = NormalizeOptional(request.Category),
            Color = NormalizeOptional(request.Color),
            Description = NormalizeOptional(request.Description)
        };

        await savingsGoalRepository.AddAsync(savingsGoal, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(savingsGoal);
    }

    public async Task<IReadOnlyList<SavingsGoalResponse>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var savingsGoals = await savingsGoalRepository.ListByUserIdAsync(userId, cancellationToken);
        return savingsGoals.Select(MapToResponse).ToList();
    }

    public async Task<SavingsGoalResponse> UpdateAsync(
        Guid userId,
        Guid savingsGoalId,
        UpdateSavingsGoalRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var savingsGoal = await GetUserSavingsGoalAsync(userId, savingsGoalId, cancellationToken);

        savingsGoal.Name = NormalizeRequired(request.Name, "Savings goal name is required.");
        savingsGoal.TargetAmount = ValidateTargetAmount(request.TargetAmount);
        savingsGoal.CurrentAmount = ValidateCurrentAmount(request.CurrentAmount, request.TargetAmount);
        savingsGoal.TargetDate = request.TargetDate;
        savingsGoal.Category = NormalizeOptional(request.Category);
        savingsGoal.Color = NormalizeOptional(request.Color);
        savingsGoal.Description = NormalizeOptional(request.Description);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(savingsGoal);
    }

    public async Task DeleteAsync(Guid userId, Guid savingsGoalId, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var savingsGoal = await GetUserSavingsGoalAsync(userId, savingsGoalId, cancellationToken);
        savingsGoalRepository.Remove(savingsGoal);

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<SavingsGoal> GetUserSavingsGoalAsync(
        Guid userId,
        Guid savingsGoalId,
        CancellationToken cancellationToken)
    {
        if (savingsGoalId == Guid.Empty)
        {
            throw new ArgumentException("Savings goal id is required.", nameof(savingsGoalId));
        }

        var savingsGoal = await savingsGoalRepository.GetByIdAsync(savingsGoalId, cancellationToken)
            ?? throw new NotFoundException($"Savings goal '{savingsGoalId}' was not found.");

        if (savingsGoal.UserId != userId)
        {
            throw new UnauthorizedAccessException("Savings goal does not belong to the user.");
        }

        return savingsGoal;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static decimal ValidateTargetAmount(decimal targetAmount)
    {
        if (targetAmount <= 0)
        {
            throw new ArgumentException("Savings goal target amount must be greater than 0.", nameof(targetAmount));
        }

        return targetAmount;
    }

    private static decimal ValidateCurrentAmount(decimal currentAmount, decimal targetAmount)
    {
        if (currentAmount < 0)
        {
            throw new ArgumentException("Savings goal current amount cannot be negative.", nameof(currentAmount));
        }

        if (targetAmount > 0 && currentAmount > targetAmount)
        {
            throw new ArgumentException("Savings goal current amount cannot exceed target amount.", nameof(currentAmount));
        }

        return currentAmount;
    }

    private static string NormalizeRequired(string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException(message, nameof(value));
        }

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static SavingsGoalResponse MapToResponse(SavingsGoal savingsGoal)
    {
        return new SavingsGoalResponse(
            savingsGoal.Id,
            savingsGoal.UserId,
            savingsGoal.Name,
            savingsGoal.TargetAmount,
            savingsGoal.CurrentAmount,
            savingsGoal.TargetDate,
            savingsGoal.Category,
            savingsGoal.Color,
            savingsGoal.Description);
    }
}
