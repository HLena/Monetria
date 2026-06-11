using Monetria.Application.Accounts;
using Monetria.Application.Categories;
using Monetria.Application.Common;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
using PagedResponse = Monetria.Application.Common.PagedResponse<Monetria.Application.Recurrings.RecurringResponse>;

namespace Monetria.Application.Recurrings;

public sealed class RecurringService(
    IRecurringRepository recurringRepository,
    IAccountRepository accountRepository,
    ICategoryRepository categoryRepository,
    IUnitOfWork unitOfWork) : IRecurringService
{
    public async Task<RecurringResponse> CreateAsync(
        Guid userId,
        CreateRecurringRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateCreateRequest(request);

        await EnsureAccountBelongsToUserAsync(userId, request.AccountId, cancellationToken);

        if (request.Type == TransactionType.Transfer)
        {
            if (!request.ToAccountId.HasValue || request.ToAccountId == Guid.Empty)
                throw new ArgumentException("ToAccountId is required for transfer recurrings.", nameof(request));

            await EnsureAccountBelongsToUserAsync(userId, request.ToAccountId.Value, cancellationToken);
        }

        Category? category = null;
        if (request.CategoryId.HasValue)
        {
            category = await categoryRepository.GetByIdAsync(request.CategoryId.Value, cancellationToken)
                ?? throw new NotFoundException($"Category '{request.CategoryId}' was not found.");

            if (!category.IsActive)
                throw new InvalidOperationException("Category is inactive.");

            if (category.UserId.HasValue && category.UserId.Value != userId)
                throw new UnauthorizedAccessException("Category does not belong to the user.");
        }

        var recurring = new Recurring
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountId = request.AccountId,
            ToAccountId = request.Type == TransactionType.Transfer ? request.ToAccountId : null,
            CategoryId = request.CategoryId,
            Category = category,
            Name = request.Name.Trim(),
            Type = request.Type,
            AmountType = request.AmountType,
            Amount = request.Amount,
            EstimatedAmount = request.EstimatedAmount,
            Frequency = request.Frequency,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            NextDueDate = request.NextDueDate,
            IsActive = true,
        };

        await recurringRepository.AddAsync(recurring, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(recurring);
    }

    public async Task<PagedResponse> ListByUserIdAsync(
        Guid userId,
        RecurringFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        var recurrings = await recurringRepository.ListByUserIdAsync(userId, filter, cancellationToken);
        var totalCount = await recurringRepository.CountByUserIdAsync(userId, filter, cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResponse(recurrings.Select(MapToResponse).ToList(), totalCount, page, pageSize, totalPages);
    }

    public async Task<RecurringResponse> UpdateAsync(
        Guid userId,
        Guid recurringId,
        UpdateRecurringRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateUpdateRequest(request);

        var recurring = await GetUserRecurringAsync(userId, recurringId, cancellationToken);

        await EnsureAccountBelongsToUserAsync(userId, request.AccountId, cancellationToken);

        if (request.Type == TransactionType.Transfer)
        {
            if (!request.ToAccountId.HasValue || request.ToAccountId == Guid.Empty)
                throw new ArgumentException("ToAccountId is required for transfer recurrings.", nameof(request));

            await EnsureAccountBelongsToUserAsync(userId, request.ToAccountId.Value, cancellationToken);
        }

        Category? category = null;
        if (request.CategoryId.HasValue)
        {
            category = await categoryRepository.GetByIdAsync(request.CategoryId.Value, cancellationToken)
                ?? throw new NotFoundException($"Category '{request.CategoryId}' was not found.");

            if (!category.IsActive)
                throw new InvalidOperationException("Category is inactive.");

            if (category.UserId.HasValue && category.UserId.Value != userId)
                throw new UnauthorizedAccessException("Category does not belong to the user.");
        }

        recurring.AccountId = request.AccountId;
        recurring.ToAccountId = request.Type == TransactionType.Transfer ? request.ToAccountId : null;
        recurring.CategoryId = request.CategoryId;
        recurring.Category = category;
        recurring.Name = request.Name.Trim();
        recurring.Type = request.Type;
        recurring.AmountType = request.AmountType;
        recurring.Amount = request.Amount;
        recurring.EstimatedAmount = request.EstimatedAmount;
        recurring.Frequency = request.Frequency;
        recurring.StartDate = request.StartDate;
        recurring.EndDate = request.EndDate;
        recurring.NextDueDate = request.NextDueDate;
        recurring.IsActive = request.IsActive;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(recurring);
    }

    public async Task<RecurringResponse> DeactivateAsync(
        Guid userId,
        Guid recurringId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var recurring = await GetUserRecurringAsync(userId, recurringId, cancellationToken);
        recurring.IsActive = false;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(recurring);
    }

    private async Task EnsureAccountBelongsToUserAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        if (accountId == Guid.Empty)
            throw new ArgumentException("Account id is required.", nameof(accountId));

        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{accountId}' was not found.");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("Account does not belong to the user.");
    }

    private async Task<Recurring> GetUserRecurringAsync(Guid userId, Guid recurringId, CancellationToken cancellationToken)
    {
        if (recurringId == Guid.Empty)
            throw new ArgumentException("Recurring id is required.", nameof(recurringId));

        var recurring = await recurringRepository.GetByIdAsync(recurringId, cancellationToken)
            ?? throw new NotFoundException($"Recurring '{recurringId}' was not found.");

        if (recurring.UserId != userId)
            throw new UnauthorizedAccessException("Recurring does not belong to the user.");

        return recurring;
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));
    }

    private static void ValidateCreateRequest(CreateRecurringRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Recurring name is required.", nameof(request));

        ValidateAmountForAmountType(request.AmountType, request.Amount, request.EstimatedAmount);
    }

    private static void ValidateUpdateRequest(UpdateRecurringRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Recurring name is required.", nameof(request));

        ValidateAmountForAmountType(request.AmountType, request.Amount, request.EstimatedAmount);
    }

    private static void ValidateAmountForAmountType(RecurringAmountType amountType, decimal? amount, decimal? estimatedAmount)
    {
        if (amountType == RecurringAmountType.Fixed && (!amount.HasValue || amount <= 0))
            throw new ArgumentException("Amount is required and must be greater than 0 for Fixed recurrings.");

        if (amountType == RecurringAmountType.Estimated && (!estimatedAmount.HasValue || estimatedAmount <= 0))
            throw new ArgumentException("EstimatedAmount is required and must be greater than 0 for Estimated recurrings.");
    }

    private static RecurringResponse MapToResponse(Recurring recurring) =>
        new(
            recurring.Id,
            recurring.UserId,
            recurring.AccountId,
            recurring.ToAccountId,
            recurring.CategoryId,
            recurring.Category?.Name,
            recurring.Name,
            recurring.Type,
            recurring.AmountType,
            recurring.Amount,
            recurring.EstimatedAmount,
            recurring.Frequency,
            recurring.StartDate,
            recurring.EndDate,
            recurring.NextDueDate,
            recurring.IsActive);
}
