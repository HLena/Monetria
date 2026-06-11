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
        ValidateRequest(request.CategoryId, request.LimitAmount, request.Month, request.Year);

        var budget = new Budget
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CategoryId = request.CategoryId,
            LimitAmount = request.LimitAmount,
            Month = request.Month,
            Year = request.Year,
            RolloverUnused = request.RolloverUnused,
            CreatedAt = DateTime.UtcNow
        };

        await budgetRepository.AddAsync(budget, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new BudgetResponse(
            budget.Id,
            budget.UserId,
            budget.CategoryId,
            budget.LimitAmount,
            budget.Month,
            budget.Year,
            budget.RolloverUnused,
            SpentAmount: 0,
            budget.CreatedAt);
    }

    public async Task<IReadOnlyList<BudgetResponse>> ListByUserIdAsync(
        Guid userId,
        int? month = null,
        int? year = null,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var budgets = await budgetRepository.ListByUserIdAsync(userId, month, year, cancellationToken);

        var responses = new List<BudgetResponse>(budgets.Count);
        foreach (var budget in budgets)
        {
            var spent = await budgetRepository.GetSpentAmountAsync(
                userId, budget.CategoryId, budget.Month, budget.Year, cancellationToken);
            responses.Add(MapToResponse(budget, spent));
        }

        return responses;
    }

    public async Task<BudgetResponse> UpdateAsync(
        Guid userId,
        Guid budgetId,
        UpdateBudgetRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateEntityId(budgetId);
        ValidateRequest(request.CategoryId, request.LimitAmount, request.Month, request.Year);

        var budget = await GetUserBudgetAsync(userId, budgetId, cancellationToken);

        budget.CategoryId = request.CategoryId;
        budget.LimitAmount = request.LimitAmount;
        budget.Month = request.Month;
        budget.Year = request.Year;
        budget.RolloverUnused = request.RolloverUnused;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        var spent = await budgetRepository.GetSpentAmountAsync(
            userId, budget.CategoryId, budget.Month, budget.Year, cancellationToken);

        return MapToResponse(budget, spent);
    }

    public async Task DeleteAsync(Guid userId, Guid budgetId, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateEntityId(budgetId);
        var budget = await GetUserBudgetAsync(userId, budgetId, cancellationToken);

        budgetRepository.Remove(budget);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Budget> GetUserBudgetAsync(Guid userId, Guid budgetId, CancellationToken cancellationToken)
    {
        var budget = await budgetRepository.GetByIdAsync(budgetId, cancellationToken)
            ?? throw new NotFoundException($"Budget '{budgetId}' was not found.");

        if (budget.UserId != userId)
            throw new UnauthorizedAccessException("Budget does not belong to the user.");

        return budget;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));
    }

    private static void ValidateEntityId(Guid id)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Budget id is required.", nameof(id));
    }

    private static void ValidateRequest(Guid categoryId, decimal limitAmount, int month, int year)
    {
        if (categoryId == Guid.Empty)
            throw new ArgumentException("Category id is required.", nameof(categoryId));

        if (limitAmount <= 0)
            throw new ArgumentException("Budget limit amount must be greater than 0.", nameof(limitAmount));

        if (month < 1 || month > 12)
            throw new ArgumentException("Month must be between 1 and 12.", nameof(month));

        if (year < 1)
            throw new ArgumentException("Year must be greater than 0.", nameof(year));
    }

    private static BudgetResponse MapToResponse(Budget budget, decimal spentAmount) =>
        new(budget.Id,
            budget.UserId,
            budget.CategoryId,
            budget.LimitAmount,
            budget.Month,
            budget.Year,
            budget.RolloverUnused,
            spentAmount,
            budget.CreatedAt);
}
