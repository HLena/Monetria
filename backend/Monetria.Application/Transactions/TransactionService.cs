using Monetria.Application.Accounts;
using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.Transactions;

public sealed class TransactionService(
    ITransactionRepository transactionRepository,
    IAccountRepository accountRepository,
    IUnitOfWork unitOfWork) : ITransactionService
{
    public async Task<TransactionResponse> CreateAsync(
        CreateTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCreateRequest(request);

        var accountExists = await accountRepository.ExistsAsync(request.AccountId, cancellationToken);
        if (!accountExists)
        {
            throw new InvalidOperationException($"Account '{request.AccountId}' was not found.");
        }

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            AccountId = request.AccountId,
            Type = request.Type,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Description = request.Description.Trim(),
            Date = request.Date,
            CreatedAt = DateTime.UtcNow
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
        Guid accountId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        if (accountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(accountId));
        }

        ValidateFilter(filter);

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
