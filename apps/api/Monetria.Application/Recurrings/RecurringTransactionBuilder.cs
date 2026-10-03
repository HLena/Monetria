using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Recurrings;

internal static class RecurringTransactionBuilder
{
    public static Transaction Build(
        Guid fromAccountId,
        TransactionType type,
        Guid? categoryId,
        decimal amount,
        string description,
        Guid? toAccountId,
        Guid? transferPairId,
        DateTime now) =>
        new()
        {
            Id = Guid.NewGuid(),
            FromAccountId = fromAccountId,
            Type = type,
            CategoryId = categoryId,
            Amount = amount,
            Description = description,
            ToAccountId = toAccountId,
            TransferPairId = transferPairId,
            IsActive = true,
            Date = now,
            CreatedAt = now
        };
}
