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
            Category = request.Category.Trim(),
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

    public async Task<IReadOnlyList<TransactionResponse>> ListByAccountIdAsync(
        Guid accountId,
        CancellationToken cancellationToken = default)
    {
        if (accountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(accountId));
        }

        var transactions = await transactionRepository.ListByAccountIdAsync(accountId, cancellationToken);

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

        if (string.IsNullOrWhiteSpace(request.Category))
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

    private static TransactionResponse MapToResponse(Transaction transaction)
    {
        return new TransactionResponse(
            transaction.Id,
            transaction.AccountId,
            transaction.Type,
            transaction.Category,
            transaction.Amount,
            transaction.Description,
            transaction.Date,
            transaction.CreatedAt);
    }
}
