using Monetria.Domain.Entities;

namespace Monetria.Application.Transactions;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);

    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<decimal> GetAccountBalanceDeltaAsync(Guid accountId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> ListByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default);

    Task<int> CountByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> ListByAccountIdAsync(
        Guid accountId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default);

    Task<Transaction?> GetTransferPairAsync(Guid transactionId, Guid transferPairId, CancellationToken cancellationToken = default);

    Task<TransactionSummaryResponse> GetSummaryByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MonthFlowPoint>> GetMonthlyFlowAsync(
        Guid userId,
        DateTime periodStart,
        DateTime periodEnd,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WeekFlowPoint>> GetWeeklyFlowAsync(
        Guid userId,
        int month,
        int year,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategorySpendingPoint>> GetSpendingByCategoryAsync(
        Guid userId,
        DateTime periodStart,
        DateTime periodEnd,
        CancellationToken cancellationToken = default);
}
