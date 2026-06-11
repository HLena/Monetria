using Monetria.Application.Common;
using Monetria.Application.Transactions;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Recurrings;

public sealed class RecurringOccurrenceService(
    IRecurringOccurrenceRepository occurrenceRepository,
    IRecurringRepository recurringRepository,
    ITransactionRepository transactionRepository,
    IUnitOfWork unitOfWork) : IRecurringOccurrenceService
{
    public async Task<IReadOnlyList<RecurringOccurrenceResponse>> ListByRecurringIdAsync(
        Guid userId,
        Guid recurringId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        await GetUserRecurringAsync(userId, recurringId, cancellationToken);

        var occurrences = await occurrenceRepository.ListByRecurringIdAsync(recurringId, cancellationToken);
        return occurrences.Select(MapToResponse).ToList();
    }

    public async Task<RecurringOccurrenceResponse> ConfirmAsync(
        Guid userId,
        Guid occurrenceId,
        ConfirmOccurrenceRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var occurrence = await GetUserOccurrenceAsync(userId, occurrenceId, cancellationToken);

        if (occurrence.Status != RecurringOccurrenceStatus.Pending)
            throw new InvalidOperationException(
                $"Occurrence cannot be confirmed — current status is '{occurrence.Status}'.");

        var recurring = occurrence.Recurring;
        var realAmount = ResolveRealAmount(recurring.AmountType, request.RealAmount, occurrence.SuggestedAmount);
        var now = DateTime.UtcNow;

        if (recurring.Type == TransactionType.Transfer)
        {
            if (!recurring.ToAccountId.HasValue)
                throw new InvalidOperationException("Transfer recurring is missing ToAccountId.");

            var transferPairId = Guid.NewGuid();

            var outgoing = BuildTransaction(
                recurring.AccountId, recurring.Type, recurring.CategoryId,
                realAmount, recurring.Name, recurring.ToAccountId, transferPairId, now);

            var incoming = BuildTransaction(
                recurring.ToAccountId.Value, recurring.Type, recurring.CategoryId,
                realAmount, recurring.Name, null, transferPairId, now);

            await transactionRepository.AddAsync(outgoing, cancellationToken);
            await transactionRepository.AddAsync(incoming, cancellationToken);

            occurrence.TransactionId = outgoing.Id;
        }
        else
        {
            var transaction = BuildTransaction(
                recurring.AccountId, recurring.Type, recurring.CategoryId,
                realAmount, recurring.Name, null, null, now);

            await transactionRepository.AddAsync(transaction, cancellationToken);
            occurrence.TransactionId = transaction.Id;
        }

        occurrence.Status = RecurringOccurrenceStatus.Confirmed;
        occurrence.RealAmount = realAmount;
        occurrence.ConfirmedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(occurrence);
    }

    public async Task<RecurringOccurrenceResponse> SkipAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        var occurrence = await GetUserOccurrenceAsync(userId, occurrenceId, cancellationToken);

        if (occurrence.Status != RecurringOccurrenceStatus.Pending)
            throw new InvalidOperationException(
                $"Occurrence cannot be skipped — current status is '{occurrence.Status}'.");

        occurrence.Status = RecurringOccurrenceStatus.Skipped;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(occurrence);
    }

    private async Task<RecurringOccurrence> GetUserOccurrenceAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken)
    {
        if (occurrenceId == Guid.Empty)
            throw new ArgumentException("Occurrence id is required.", nameof(occurrenceId));

        var occurrence = await occurrenceRepository.GetByIdAsync(occurrenceId, cancellationToken)
            ?? throw new NotFoundException($"Occurrence '{occurrenceId}' was not found.");

        if (occurrence.Recurring.UserId != userId)
            throw new UnauthorizedAccessException("Occurrence does not belong to the user.");

        return occurrence;
    }

    private async Task<Recurring> GetUserRecurringAsync(
        Guid userId,
        Guid recurringId,
        CancellationToken cancellationToken)
    {
        if (recurringId == Guid.Empty)
            throw new ArgumentException("Recurring id is required.", nameof(recurringId));

        var recurring = await recurringRepository.GetByIdAsync(recurringId, cancellationToken)
            ?? throw new NotFoundException($"Recurring '{recurringId}' was not found.");

        if (recurring.UserId != userId)
            throw new UnauthorizedAccessException("Recurring does not belong to the user.");

        return recurring;
    }

    private static decimal ResolveRealAmount(
        RecurringAmountType amountType,
        decimal? requestedAmount,
        decimal? suggestedAmount)
    {
        return amountType switch
        {
            RecurringAmountType.VariableFree =>
                requestedAmount is > 0
                    ? requestedAmount.Value
                    : throw new ArgumentException("RealAmount is required and must be greater than 0 for VariableFree recurrings."),

            RecurringAmountType.Estimated =>
                (requestedAmount ?? suggestedAmount) is { } amount && amount > 0
                    ? amount
                    : throw new ArgumentException("No valid amount available to confirm this occurrence."),

            RecurringAmountType.Fixed =>
                throw new InvalidOperationException("Fixed recurrings are auto-registered and cannot be manually confirmed."),

            _ => throw new InvalidOperationException($"Unknown AmountType '{amountType}'.")
        };
    }

    private static Transaction BuildTransaction(
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

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));
    }

    private static RecurringOccurrenceResponse MapToResponse(RecurringOccurrence o) =>
        new(o.Id, o.RecurringId, o.ScheduledDate, o.Status,
            o.SuggestedAmount, o.RealAmount, o.TransactionId, o.ConfirmedAt);
}
