using Monetria.Application.Accounts;
using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.FixedExpenses;

public sealed class FixedExpenseService(
    IFixedExpenseRepository fixedExpenseRepository,
    IAccountRepository accountRepository,
    IUnitOfWork unitOfWork) : IFixedExpenseService
{
    public async Task<FixedExpenseResponse> CreateAsync(
        Guid userId,
        CreateFixedExpenseRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        await EnsureAccountBelongsToUserAsync(userId, request.AccountId, cancellationToken);

        var fixedExpense = new FixedExpense
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountId = request.AccountId,
            Name = NormalizeRequired(request.Name, "Fixed expense name is required."),
            Amount = ValidateAmount(request.Amount),
            Category = NormalizeRequired(request.Category, "Fixed expense category is required."),
            Period = request.Period,
            DueDay = ValidateDueDay(request.DueDay),
            IsActive = true,
            Notes = NormalizeOptional(request.Notes)
        };

        await fixedExpenseRepository.AddAsync(fixedExpense, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(fixedExpense);
    }

    public async Task<IReadOnlyList<FixedExpenseResponse>> ListByUserIdAsync(
        Guid userId,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var fixedExpenses = await fixedExpenseRepository.ListByUserIdAsync(userId, includeInactive, cancellationToken);
        return fixedExpenses.Select(MapToResponse).ToList();
    }

    public async Task<FixedExpenseResponse> UpdateAsync(
        Guid userId,
        Guid fixedExpenseId,
        UpdateFixedExpenseRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var fixedExpense = await GetUserFixedExpenseAsync(userId, fixedExpenseId, cancellationToken);
        await EnsureAccountBelongsToUserAsync(userId, request.AccountId, cancellationToken);

        fixedExpense.AccountId = request.AccountId;
        fixedExpense.Name = NormalizeRequired(request.Name, "Fixed expense name is required.");
        fixedExpense.Amount = ValidateAmount(request.Amount);
        fixedExpense.Category = NormalizeRequired(request.Category, "Fixed expense category is required.");
        fixedExpense.Period = request.Period;
        fixedExpense.DueDay = ValidateDueDay(request.DueDay);
        fixedExpense.IsActive = request.IsActive;
        fixedExpense.Notes = NormalizeOptional(request.Notes);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(fixedExpense);
    }

    public async Task<FixedExpenseResponse> DeactivateAsync(
        Guid userId,
        Guid fixedExpenseId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var fixedExpense = await GetUserFixedExpenseAsync(userId, fixedExpenseId, cancellationToken);
        fixedExpense.IsActive = false;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(fixedExpense);
    }

    private async Task EnsureAccountBelongsToUserAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        if (accountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(accountId));
        }

        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{accountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Account does not belong to the user.");
        }
    }

    private async Task<FixedExpense> GetUserFixedExpenseAsync(
        Guid userId,
        Guid fixedExpenseId,
        CancellationToken cancellationToken)
    {
        if (fixedExpenseId == Guid.Empty)
        {
            throw new ArgumentException("Fixed expense id is required.", nameof(fixedExpenseId));
        }

        var fixedExpense = await fixedExpenseRepository.GetByIdAsync(fixedExpenseId, cancellationToken)
            ?? throw new NotFoundException($"Fixed expense '{fixedExpenseId}' was not found.");

        if (fixedExpense.UserId != userId)
        {
            throw new UnauthorizedAccessException("Fixed expense does not belong to the user.");
        }

        return fixedExpense;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static decimal ValidateAmount(decimal amount)
    {
        if (amount <= 0)
        {
            throw new ArgumentException("Fixed expense amount must be greater than 0.", nameof(amount));
        }

        return amount;
    }

    private static int? ValidateDueDay(int? dueDay)
    {
        if (dueDay.HasValue && (dueDay < 1 || dueDay > 31))
        {
            throw new ArgumentException("Due day must be between 1 and 31.", nameof(dueDay));
        }

        return dueDay;
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

    private static FixedExpenseResponse MapToResponse(FixedExpense fixedExpense)
    {
        return new FixedExpenseResponse(
            fixedExpense.Id,
            fixedExpense.UserId,
            fixedExpense.AccountId,
            fixedExpense.Name,
            fixedExpense.Amount,
            fixedExpense.Category,
            fixedExpense.Period,
            fixedExpense.DueDay,
            fixedExpense.IsActive,
            fixedExpense.Notes);
    }
}
