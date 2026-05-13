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

        var account = await accountRepository.GetByIdAsync(request.AccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{request.AccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Account does not belong to the user.");
        }

        var category = await categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException($"Category '{request.CategoryId}' was not found.");

        ValidateCategory(userId, request, category);
        await ValidateCreditLimitAsync(account, request, cancellationToken);

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            AccountId = request.AccountId,
            Type = request.Type,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Description = request.Description.Trim(),
            Date = request.Date,
            CreatedAt = DateTime.UtcNow,
            Category = category
        };

        transaction.Validate();

        await transactionRepository.AddAsync(transaction, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(transaction);
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

        var accountFilter = filter with { AccountId = accountId };
        var transactions = await transactionRepository.ListByAccountIdAsync(accountId, accountFilter, cancellationToken);

        return transactions
            .Select(MapToResponse)
            .ToList();
    }

    private static void ValidateCreateRequest(CreateTransactionRequest request)
    {
        if (request.AccountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(request));
        }

        if (request.CategoryId == Guid.Empty)
        {
            throw new ArgumentException("Transaction category is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            throw new ArgumentException("Transaction description is required.", nameof(request));
        }

        if (request.Amount <= 0)
        {
            throw new ArgumentException("Transaction amount must be greater than 0.", nameof(request));
        }

        if (request.Type is not (TransactionType.Income or TransactionType.Expense))
        {
            throw new ArgumentException("Transaction type must be Income or Expense.", nameof(request));
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

        var currentBalance = account.InitialBalance
            + await transactionRepository.GetAccountBalanceDeltaAsync(account.Id, cancellationToken);
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
        if (filter.AccountId == Guid.Empty)
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
            transaction.AccountId,
            transaction.Type,
            transaction.CategoryId,
            transaction.Category?.Name ?? string.Empty,
            transaction.Category?.Color,
            transaction.Amount,
            transaction.Description,
            transaction.Date,
            transaction.CreatedAt);
    }
}
