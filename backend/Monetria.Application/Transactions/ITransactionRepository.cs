using Monetria.Domain.Entities;

namespace Monetria.Application.Transactions;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Transaction>> ListByAccountIdAsync(Guid accountId, CancellationToken cancellationToken = default);
}
