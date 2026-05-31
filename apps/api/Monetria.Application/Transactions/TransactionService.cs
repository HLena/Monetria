using Monetria.Application.Accounts;
using Monetria.Application.Categories;
using Monetria.Application.Common;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Transactions;

public sealed class TransactionService(
    ITransactionRepository transactionRepository,
    IAccountRepository accountRepository,
    ICategoryRepository categoryRepository,
    IUnitOfWork unitOfWork) : ITransactionService
{
    public async Task<TransactionResponse> CreateAsync(
        Guid userId,
        CreateTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateCreateRequest(request);

        var account = await accountRepository.GetByIdAsync(request.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{request.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Account does not belong to the user.");
        }

        Category? category = null;

        if (request.Type != TransactionType.Transfer)
        {
            category = await categoryRepository.GetByIdAsync(request.CategoryId!.Value, cancellationToken)
                ?? throw new NotFoundException($"Category '{request.CategoryId}' was not found.");

            ValidateCategory(userId, request, category);
        }

        if (request.Type == TransactionType.Transfer)
        {
            var transferAccount = await accountRepository.GetByIdAsync(request.ToAccountId!.Value, cancellationToken)
                ?? throw new NotFoundException($"Transfer account '{request.ToAccountId}' was not found.");

            if (transferAccount.UserId != userId)
            {
                throw new UnauthorizedAccessException("Transfer account does not belong to the user.");
            }
        }

        await ValidateCreditLimitAsync(account, request, cancellationToken);

        if (request.Type == TransactionType.Transfer)
        {
            var pairId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var outflow = new Transaction
            {
                Id = Guid.NewGuid(),
                FromAccountId = request.FromAccountId,
                Type = TransactionType.Transfer,
                Amount = request.Amount,
                Description = request.Description?.Trim(),
                ToAccountId = request.ToAccountId,
                TransferPairId = pairId,
                IsActive = true,
                Date = request.Date,
                CreatedAt = now
            };

            var inflow = new Transaction
            {
                Id = Guid.NewGuid(),
                FromAccountId = request.ToAccountId!.Value,
                Type = TransactionType.Transfer,
                Amount = request.Amount,
                Description = request.Description?.Trim(),
                ToAccountId = null,
                TransferPairId = pairId,
                IsActive = true,
                Date = request.Date,
                CreatedAt = now
            };

            await transactionRepository.AddAsync(outflow, cancellationToken);
            await transactionRepository.AddAsync(inflow, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return MapToResponse(outflow);
        }

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            FromAccountId = request.FromAccountId,
            Type = request.Type,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Description = request.Description?.Trim(),
            IsActive = true,
            Date = request.Date,
            CreatedAt = DateTime.UtcNow,
            Category = category
        };

        await transactionRepository.AddAsync(transaction, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(transaction);
    }

    public async Task<TransactionResponse> GetByIdAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var transaction = await transactionRepository.GetByIdAsync(transactionId, cancellationToken)
            ?? throw new NotFoundException($"Transaction '{transactionId}' was not found.");

        var account = await accountRepository.GetByIdAsync(transaction.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{transaction.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Transaction does not belong to the user.");
        }

        return MapToResponse(transaction);
    }

    public async Task<TransactionResponse> UpdateAsync(
        Guid userId,
        Guid transactionId,
        UpdateTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateUpdateRequest(request);

        var transaction = await transactionRepository.GetByIdAsync(transactionId, cancellationToken)
            ?? throw new NotFoundException($"Transaction '{transactionId}' was not found.");

        if (!transaction.IsActive)
        {
            throw new InvalidOperationException("Transaction has been deleted.");
        }

        var account = await accountRepository.GetByIdAsync(transaction.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{transaction.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Transaction does not belong to the user.");
        }

        if (request.CategoryId.HasValue)
        {
            var category = await categoryRepository.GetByIdAsync(request.CategoryId.Value, cancellationToken)
                ?? throw new NotFoundException($"Category '{request.CategoryId}' was not found.");

            if (!category.IsActive)
            {
                throw new InvalidOperationException("Transaction category is inactive.");
            }

            if (category.UserId.HasValue && category.UserId.Value != userId)
            {
                throw new UnauthorizedAccessException("Category does not belong to the user.");
            }

            if (category.Type != transaction.Type)
            {
                throw new InvalidOperationException("Transaction type must match the category type.");
            }

            transaction.Category = category;
            transaction.CategoryId = request.CategoryId;
        }

        if (request.FromAccountId != Guid.Empty && request.FromAccountId != transaction.FromAccountId)
        {
            var newAccount = await accountRepository.GetByIdAsync(request.FromAccountId, cancellationToken)
                ?? throw new NotFoundException($"Account '{request.FromAccountId}' was not found.");

            if (newAccount.UserId != userId)
            {
                throw new UnauthorizedAccessException("Account does not belong to the user.");
            }

            transaction.FromAccountId = request.FromAccountId;
        }

        transaction.Amount = request.Amount;
        transaction.Description = request.Description?.Trim();
        transaction.Date = request.TransactionDate;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(transaction);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var transaction = await transactionRepository.GetByIdAsync(transactionId, cancellationToken)
            ?? throw new NotFoundException($"Transaction '{transactionId}' was not found.");

        if (!transaction.IsActive)
        {
            throw new InvalidOperationException("Transaction has already been deleted.");
        }

        var account = await accountRepository.GetByIdAsync(transaction.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{transaction.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Transaction does not belong to the user.");
        }

        transaction.IsActive = false;

        if (transaction.Type == TransactionType.Transfer && transaction.TransferPairId.HasValue)
        {
            var pair = await transactionRepository.GetTransferPairAsync(transaction.Id, transaction.TransferPairId.Value, cancellationToken);
            if (pair != null)
            {
                pair.IsActive = false;
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TransactionResponse>> ListByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }

        ValidateFilter(filter);

        var transactions = await transactionRepository.ListByUserIdAsync(userId, filter, cancellationToken);

        return transactions
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<IReadOnlyList<TransactionResponse>> ListByAccountIdAsync(
        Guid userId,
        Guid accountId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        if (accountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(accountId));
        }

        ValidateFilter(filter);
        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{accountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Account does not belong to the user.");
        }

        var accountFilter = filter with { FromAccountId = accountId };
        var transactions = await transactionRepository.ListByAccountIdAsync(accountId, accountFilter, cancellationToken);

        return transactions
            .Select(MapToResponse)
            .ToList();
    }

    private static void ValidateCreateRequest(CreateTransactionRequest request)
    {
        if (request.FromAccountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(request));
        }

        if (request.Amount <= 0)
        {
            throw new ArgumentException("Transaction amount must be greater than 0.", nameof(request));
        }

        if (request.Description != null && request.Description.Length > 500)
        {
            throw new ArgumentException("Transaction description must not exceed 500 characters.", nameof(request));
        }

        if (request.Type == TransactionType.Transfer)
        {
            if (!request.ToAccountId.HasValue || request.ToAccountId == Guid.Empty)
            {
                throw new ArgumentException("Transfer account is required for transfer transactions.", nameof(request));
            }

            if (request.ToAccountId == request.FromAccountId)
            {
                throw new ArgumentException("Transfer account must be different from the source account.", nameof(request));
            }

            return;
        }

        if (request.Type is not (TransactionType.Income or TransactionType.Expense))
        {
            throw new ArgumentException("Transaction type must be Income, Expense, or Transfer.", nameof(request));
        }

        if (request.Type == TransactionType.Expense && (!request.CategoryId.HasValue || request.CategoryId == Guid.Empty))
        {
            throw new ArgumentException("Category is required for expense transactions.", nameof(request));
        }
    }

    private static void ValidateUpdateRequest(UpdateTransactionRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("Transaction amount must be greater than 0.", nameof(request));
        }

        if (request.Description != null && request.Description.Length > 500)
        {
            throw new ArgumentException("Transaction description must not exceed 500 characters.", nameof(request));
        }
    }

    private static void ValidateCategory(Guid userId, CreateTransactionRequest request, Category category)
    {
        if (!category.IsActive)
        {
            throw new InvalidOperationException("Transaction category is inactive.");
        }

        if (category.UserId.HasValue && category.UserId.Value != userId)
        {
            throw new UnauthorizedAccessException("Category does not belong to the user.");
        }

        if (category.Type != request.Type)
        {
            throw new InvalidOperationException("Transaction type must match the category type.");
        }
    }

    private async Task ValidateCreditLimitAsync(
        Account account,
        CreateTransactionRequest request,
        CancellationToken cancellationToken)
    {
        if (account.Type != AccountType.CreditCard || request.Type != TransactionType.Expense)
        {
            return;
        }

        var currentBalance = await transactionRepository.GetAccountBalanceDeltaAsync(account.Id, cancellationToken);
        var projectedBalance = currentBalance - request.Amount;
        var projectedDebt = Math.Max(0, -projectedBalance);

        if (projectedDebt > account.CreditLimit)
        {
            throw new InvalidOperationException("Transaction exceeds the account credit limit.");
        }
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static void ValidateFilter(TransactionFilterRequest filter)
    {
        if (filter.FromAccountId == Guid.Empty)
        {
            throw new ArgumentException("Account id filter cannot be empty.", nameof(filter));
        }

        if (filter.CategoryId == Guid.Empty)
        {
            throw new ArgumentException("Category id filter cannot be empty.", nameof(filter));
        }

        if (filter.Month.HasValue && (filter.Month < 1 || filter.Month > 12))
        {
            throw new ArgumentException("Month filter must be between 1 and 12.", nameof(filter));
        }

        if (filter.Month.HasValue && !filter.Year.HasValue)
        {
            throw new ArgumentException("Year filter is required when month is provided.", nameof(filter));
        }

        if (filter.Year.HasValue && filter.Year < 1)
        {
            throw new ArgumentException("Year filter must be greater than 0.", nameof(filter));
        }
    }

    private static TransactionResponse MapToResponse(Transaction transaction)
    {
        return new TransactionResponse(
            transaction.Id,
            transaction.FromAccountId,
            transaction.Type,
            transaction.CategoryId,
            transaction.Category?.Name ?? string.Empty,
            transaction.Category?.Color,
            transaction.Category?.KeyIcon,
            transaction.Amount,
            transaction.Description,
            transaction.ToAccountId,
            transaction.TransferPairId,
            transaction.IsActive,
            transaction.Date,
            transaction.CreatedAt);
    }
}
