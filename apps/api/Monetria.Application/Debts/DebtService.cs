using Monetria.Application.Accounts;
using Monetria.Application.Common;
using Monetria.Application.Transactions;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Debts;

public sealed class DebtService(
    IDebtRepository debtRepository,
    IAccountRepository accountRepository,
    ITransactionRepository transactionRepository,
    IUnitOfWork unitOfWork) : IDebtService
{
    public async Task<DebtResponse> CreateAsync(
        Guid userId,
        CreateDebtRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        if (request.AccountId.HasValue)
            await ValidateAccountAsync(userId, request.AccountId.Value, cancellationToken);

        var debt = new Debt
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Name = NormalizeRequired(request.Name, "Debt name is required."),
            Creditor = NormalizeOptional(request.Creditor),
            OriginalAmount = ValidatePositive(request.OriginalAmount, "Debt original amount must be greater than 0."),
            RemainingAmount = ValidateRemainingAmount(request.RemainingAmount, request.OriginalAmount),
            InterestRate = ValidateNonNegative(request.InterestRate, "Debt interest rate cannot be negative."),
            MinimumPayment = ValidatePositive(request.MinimumPayment, "Debt minimum payment must be greater than 0."),
            NextPaymentDate = request.NextPaymentDate,
            Type = NormalizeOptional(request.Type),
            IsActive = true
        };

        await debtRepository.AddAsync(debt, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(debt);
    }

    public async Task<IReadOnlyList<DebtResponse>> ListByUserIdAsync(
        Guid userId,
        bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var debts = await debtRepository.ListByUserIdAsync(userId, isActive, cancellationToken);
        return debts.Select(MapToResponse).ToList();
    }

    public async Task<DebtResponse> UpdateAsync(
        Guid userId,
        Guid debtId,
        UpdateDebtRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var debt = await GetUserDebtAsync(userId, debtId, cancellationToken);

        if (request.AccountId.HasValue && request.AccountId != debt.AccountId)
            await ValidateAccountAsync(userId, request.AccountId.Value, cancellationToken);

        debt.AccountId = request.AccountId;
        debt.CategoryId = request.CategoryId;
        debt.Name = NormalizeRequired(request.Name, "Debt name is required.");
        debt.Creditor = NormalizeOptional(request.Creditor);
        debt.OriginalAmount = ValidatePositive(request.OriginalAmount, "Debt original amount must be greater than 0.");
        debt.RemainingAmount = ValidateRemainingAmount(request.RemainingAmount, request.OriginalAmount);
        debt.InterestRate = ValidateNonNegative(request.InterestRate, "Debt interest rate cannot be negative.");
        debt.MinimumPayment = ValidatePositive(request.MinimumPayment, "Debt minimum payment must be greater than 0.");
        debt.NextPaymentDate = request.NextPaymentDate;
        debt.Type = NormalizeOptional(request.Type);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(debt);
    }

    public async Task DeleteAsync(Guid userId, Guid debtId, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var debt = await GetUserDebtAsync(userId, debtId, cancellationToken);
        debt.IsActive = false;

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<DebtResponse> PayAsync(
        Guid userId,
        Guid debtId,
        PayDebtRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var debt = await GetUserDebtAsync(userId, debtId, cancellationToken);

        if (!debt.IsActive)
            throw new InvalidOperationException("Debt is already paid off.");

        if (request.Amount <= 0)
            throw new ArgumentException("Payment amount must be greater than 0.", nameof(request));

        if (request.Amount > debt.RemainingAmount)
            throw new ArgumentException("Payment amount cannot exceed remaining amount.", nameof(request));

        if (!debt.AccountId.HasValue)
            throw new InvalidOperationException("Debt has no linked account. Set an AccountId on the debt before making payments.");

        var account = await accountRepository.GetByIdAsync(debt.AccountId.Value, cancellationToken)
            ?? throw new NotFoundException($"Account '{debt.AccountId}' was not found.");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("Account does not belong to the user.");

        var now = DateTime.UtcNow;
        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            FromAccountId = debt.AccountId.Value,
            Type = TransactionType.Expense,
            CategoryId = debt.CategoryId,
            Amount = request.Amount,
            Description = $"Pago: {debt.Name}",
            IsActive = true,
            Date = now,
            CreatedAt = now
        };

        await transactionRepository.AddAsync(transaction, cancellationToken);

        debt.RemainingAmount -= request.Amount;
        if (debt.RemainingAmount <= 0)
        {
            debt.RemainingAmount = 0;
            debt.IsActive = false;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(debt);
    }

    private async Task ValidateAccountAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{accountId}' was not found.");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("Account does not belong to the user.");
    }

    private async Task<Debt> GetUserDebtAsync(Guid userId, Guid debtId, CancellationToken cancellationToken)
    {
        if (debtId == Guid.Empty)
            throw new ArgumentException("Debt id is required.", nameof(debtId));

        var debt = await debtRepository.GetByIdAsync(debtId, cancellationToken)
            ?? throw new NotFoundException($"Debt '{debtId}' was not found.");

        if (debt.UserId != userId)
            throw new UnauthorizedAccessException("Debt does not belong to the user.");

        return debt;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));
    }

    private static decimal ValidatePositive(decimal amount, string message)
    {
        if (amount <= 0)
            throw new ArgumentException(message, nameof(amount));

        return amount;
    }

    private static decimal ValidateNonNegative(decimal amount, string message)
    {
        if (amount < 0)
            throw new ArgumentException(message, nameof(amount));

        return amount;
    }

    private static decimal ValidateRemainingAmount(decimal remainingAmount, decimal originalAmount)
    {
        if (remainingAmount < 0)
            throw new ArgumentException("Debt remaining amount cannot be negative.", nameof(remainingAmount));

        if (remainingAmount > originalAmount)
            throw new ArgumentException("Debt remaining amount cannot exceed original amount.", nameof(remainingAmount));

        return remainingAmount;
    }

    private static string NormalizeRequired(string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException(message, nameof(value));

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static DebtResponse MapToResponse(Debt debt) =>
        new(debt.Id,
            debt.UserId,
            debt.AccountId,
            debt.CategoryId,
            debt.Name,
            debt.Creditor,
            debt.OriginalAmount,
            debt.RemainingAmount,
            debt.InterestRate,
            debt.MinimumPayment,
            debt.NextPaymentDate,
            debt.Type,
            debt.IsActive);
}
