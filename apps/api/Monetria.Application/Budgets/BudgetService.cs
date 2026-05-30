using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.Budgets;

public sealed class BudgetService(IBudgetRepository budgetRepository, IUnitOfWork unitOfWork) : IBudgetService
{
    public async Task<BudgetResponse> CreateAsync(
        Guid userId,
        CreateBudgetRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var budget = new Budget
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Category = NormalizeCategory(request.Category),
            LimitAmount = ValidateAmount(request.LimitAmount),
            Period = request.Period,
            CreatedAt = DateTime.UtcNow
        };

        await budgetRepository.AddAsync(budget, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(budget);
    }

    public async Task<IReadOnlyList<BudgetResponse>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var budgets = await budgetRepository.ListByUserIdAsync(userId, cancellationToken);

        return budgets.Select(MapToResponse).ToList();
    }

    public async Task<BudgetResponse> UpdateAsync(
        Guid userId,
        Guid budgetId,
        UpdateBudgetRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateEntityId(budgetId, "Budget id is required.");
        var budget = await GetUserBudgetAsync(userId, budgetId, cancellationToken);

        budget.Category = NormalizeCategory(request.Category);
        budget.LimitAmount = ValidateAmount(request.LimitAmount);
        budget.Period = request.Period;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(budget);
    }

    public async Task DeleteAsync(Guid userId, Guid budgetId, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateEntityId(budgetId, "Budget id is required.");
        var budget = await GetUserBudgetAsync(userId, budgetId, cancellationToken);

        budgetRepository.Remove(budget);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Budget> GetUserBudgetAsync(Guid userId, Guid budgetId, CancellationToken cancellationToken)
    {
        var budget = await budgetRepository.GetByIdAsync(budgetId, cancellationToken)
            ?? throw new NotFoundException($"Budget '{budgetId}' was not found.");

        if (budget.UserId != userId)
        {
            throw new UnauthorizedAccessException("Budget does not belong to the user.");
        }

        return budget;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static void ValidateEntityId(Guid id, string message)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException(message, nameof(id));
        }
    }

    private static string NormalizeCategory(string category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            throw new ArgumentException("Budget category is required.", nameof(category));
        }

        return category.Trim();
    }

    private static decimal ValidateAmount(decimal amount)
    {
        if (amount <= 0)
        {
            throw new ArgumentException("Budget limit amount must be greater than 0.", nameof(amount));
        }

        return amount;
    }

    private static BudgetResponse MapToResponse(Budget budget)
    {
        return new BudgetResponse(
            budget.Id,
            budget.UserId,
            budget.Category,
            budget.LimitAmount,
            budget.Period,
            budget.CreatedAt);
    }
}
