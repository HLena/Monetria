namespace Monetria.Application.Transactions;

public interface ITransactionService
{
    Task<TransactionResponse> CreateAsync(CreateTransactionRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TransactionResponse>> ListByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TransactionResponse>> ListByAccountIdAsync(
        Guid accountId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default);
}
