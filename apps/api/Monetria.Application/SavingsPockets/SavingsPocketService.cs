using Monetria.Application.Accounts;
using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.SavingsPockets;

public sealed class SavingsPocketService(
    ISavingsPocketRepository savingsPocketRepository,
    IAccountRepository accountRepository,
    IUnitOfWork unitOfWork) : ISavingsPocketService
{
    public async Task<SavingsPocketResponse> CreateAsync(
        Guid userId,
        CreateSavingsPocketRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        if (request.LinkedAccountId.HasValue)
            await ValidateLinkedAccountAsync(userId, request.LinkedAccountId.Value, cancellationToken);

        var now = DateTime.UtcNow;
        var pocket = new SavingsPocket
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = NormalizeRequired(request.Name, "Savings pocket name is required."),
            CurrentAmount = 0,
            LinkedAccountId = request.LinkedAccountId,
            Color = NormalizeOptional(request.Color),
            Description = NormalizeOptional(request.Description),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        await savingsPocketRepository.AddAsync(pocket, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(pocket);
    }

    public async Task<IReadOnlyList<SavingsPocketResponse>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var pockets = await savingsPocketRepository.ListByUserIdAsync(userId, cancellationToken);
        return pockets.Select(MapToResponse).ToList();
    }

    public async Task<SavingsPocketResponse> UpdateAsync(
        Guid userId,
        Guid pocketId,
        UpdateSavingsPocketRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var pocket = await GetUserPocketAsync(userId, pocketId, cancellationToken);

        if (request.LinkedAccountId.HasValue)
            await ValidateLinkedAccountAsync(userId, request.LinkedAccountId.Value, cancellationToken);

        pocket.Name = NormalizeRequired(request.Name, "Savings pocket name is required.");
        pocket.LinkedAccountId = request.LinkedAccountId;
        pocket.Color = NormalizeOptional(request.Color);
        pocket.Description = NormalizeOptional(request.Description);
        pocket.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(pocket);
    }

    public async Task<SavingsPocketResponse> AdjustAmountAsync(
        Guid userId,
        Guid pocketId,
        AdjustSavingsPocketRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        if (request.Amount == 0)
            throw new ArgumentException("Adjustment amount cannot be zero.", nameof(request));

        var pocket = await GetUserPocketAsync(userId, pocketId, cancellationToken);

        var newAmount = pocket.CurrentAmount + request.Amount;
        if (newAmount < 0)
            throw new ArgumentException(
                $"Insufficient balance. Current: {pocket.CurrentAmount:F2}, requested withdrawal: {Math.Abs(request.Amount):F2}.",
                nameof(request));

        pocket.CurrentAmount = newAmount;
        pocket.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(pocket);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid pocketId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var pocket = await GetUserPocketAsync(userId, pocketId, cancellationToken);

        pocket.IsActive = false;
        pocket.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<SavingsPocket> GetUserPocketAsync(
        Guid userId,
        Guid pocketId,
        CancellationToken cancellationToken)
    {
        if (pocketId == Guid.Empty)
            throw new ArgumentException("Savings pocket id is required.", nameof(pocketId));

        var pocket = await savingsPocketRepository.GetByIdAsync(pocketId, cancellationToken)
            ?? throw new NotFoundException($"Savings pocket '{pocketId}' was not found.");

        if (pocket.UserId != userId)
            throw new UnauthorizedAccessException("Savings pocket does not belong to the user.");

        return pocket;
    }

    private async Task ValidateLinkedAccountAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{accountId}' was not found.");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("Account does not belong to the user.");
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));
    }

    private static string NormalizeRequired(string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException(message, nameof(value));

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static SavingsPocketResponse MapToResponse(SavingsPocket pocket) =>
        new(
            pocket.Id,
            pocket.UserId,
            pocket.Name,
            pocket.CurrentAmount,
            pocket.LinkedAccountId,
            pocket.Color,
            pocket.Description,
            pocket.IsActive,
            pocket.CreatedAt,
            pocket.UpdatedAt);
}
