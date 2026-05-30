using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.Debts;

public sealed class DebtService(IDebtRepository debtRepository, IUnitOfWork unitOfWork) : IDebtService
{
    public async Task<DebtResponse> CreateAsync(
        Guid userId,
        CreateDebtRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var debt = new Debt
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = NormalizeRequired(request.Name, "Debt name is required."),
            Creditor = NormalizeOptional(request.Creditor),
            OriginalAmount = ValidatePositive(request.OriginalAmount, "Debt original amount must be greater than 0."),
            RemainingAmount = ValidateRemainingAmount(request.RemainingAmount, request.OriginalAmount),
            InterestRate = ValidateNonNegative(request.InterestRate, "Debt interest rate cannot be negative."),
            MinimumPayment = ValidatePositive(request.MinimumPayment, "Debt minimum payment must be greater than 0."),
            NextPaymentDate = request.NextPaymentDate,
            Type = NormalizeOptional(request.Type)
        };

        await debtRepository.AddAsync(debt, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(debt);
    }

    public async Task<IReadOnlyList<DebtResponse>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var debts = await debtRepository.ListByUserIdAsync(userId, cancellationToken);
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
        debtRepository.Remove(debt);

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Debt> GetUserDebtAsync(Guid userId, Guid debtId, CancellationToken cancellationToken)
    {
        if (debtId == Guid.Empty)
        {
            throw new ArgumentException("Debt id is required.", nameof(debtId));
        }

        var debt = await debtRepository.GetByIdAsync(debtId, cancellationToken)
            ?? throw new NotFoundException($"Debt '{debtId}' was not found.");

        if (debt.UserId != userId)
        {
            throw new UnauthorizedAccessException("Debt does not belong to the user.");
        }

        return debt;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static decimal ValidatePositive(decimal amount, string message)
    {
        if (amount <= 0)
        {
            throw new ArgumentException(message, nameof(amount));
        }

        return amount;
    }

    private static decimal ValidateNonNegative(decimal amount, string message)
    {
        if (amount < 0)
        {
            throw new ArgumentException(message, nameof(amount));
        }

        return amount;
    }

    private static decimal ValidateRemainingAmount(decimal remainingAmount, decimal originalAmount)
    {
        if (remainingAmount < 0)
        {
            throw new ArgumentException("Debt remaining amount cannot be negative.", nameof(remainingAmount));
        }

        if (remainingAmount > originalAmount)
        {
            throw new ArgumentException("Debt remaining amount cannot exceed original amount.", nameof(remainingAmount));
        }

        return remainingAmount;
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

    private static DebtResponse MapToResponse(Debt debt)
    {
        return new DebtResponse(
            debt.Id,
            debt.UserId,
            debt.Name,
            debt.Creditor,
            debt.OriginalAmount,
            debt.RemainingAmount,
            debt.InterestRate,
            debt.MinimumPayment,
            debt.NextPaymentDate,
            debt.Type);
    }
}
