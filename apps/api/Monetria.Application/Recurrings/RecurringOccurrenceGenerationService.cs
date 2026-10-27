using Monetria.Application.Common;
using Monetria.Application.Transactions;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Recurrings;

public sealed class RecurringOccurrenceGenerationService(
    IRecurringRepository recurringRepository,
    IRecurringOccurrenceRepository occurrenceRepository,
    ITransactionRepository transactionRepository,
    IUnitOfWork unitOfWork) : IRecurringOccurrenceGenerationService
{
    private const int MaxOccurrencesPerRecurringPerRun = 366;

    public async Task GenerateDueOccurrencesAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dueRecurrings = await recurringRepository.ListActiveDueAsync(today, cancellationToken);
        if (dueRecurrings.Count == 0)
            return;

        foreach (var recurring in dueRecurrings)
        {
            var iterations = 0;
            while (recurring.IsActive
                && recurring.NextDueDate <= today
                && iterations < MaxOccurrencesPerRecurringPerRun)
            {
                iterations++;
                var scheduledDate = recurring.NextDueDate;

                if (recurring.AmountType == RecurringAmountType.Fixed)
                    await GenerateAutoRegisteredAsync(recurring, scheduledDate, cancellationToken);
                else
                    await GeneratePendingAsync(recurring, scheduledDate, cancellationToken);

                recurring.NextDueDate = AdvanceDate(scheduledDate, recurring.Frequency);

                if (recurring.EndDate.HasValue && recurring.NextDueDate > recurring.EndDate.Value)
                    recurring.IsActive = false;
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task GenerateAutoRegisteredAsync(
        Recurring recurring, DateOnly scheduledDate, CancellationToken cancellationToken)
    {
        var amount = recurring.Amount!.Value;
        var now = DateTime.UtcNow;
        Guid transactionId;

        if (recurring.Type == TransactionType.Transfer)
        {
            if (!recurring.ToAccountId.HasValue)
                throw new InvalidOperationException($"Transfer recurring '{recurring.Id}' is missing ToAccountId.");

            var transferPairId = Guid.NewGuid();

            var outgoing = RecurringTransactionBuilder.Build(
                recurring.AccountId, recurring.Type, recurring.CategoryId,
                amount, recurring.Name, recurring.ToAccountId, transferPairId, now);

            var incoming = RecurringTransactionBuilder.Build(
                recurring.ToAccountId.Value, recurring.Type, recurring.CategoryId,
                amount, recurring.Name, null, transferPairId, now);

            await transactionRepository.AddAsync(outgoing, cancellationToken);
            await transactionRepository.AddAsync(incoming, cancellationToken);
            transactionId = outgoing.Id;
        }
        else
        {
            var transaction = RecurringTransactionBuilder.Build(
                recurring.AccountId, recurring.Type, recurring.CategoryId,
                amount, recurring.Name, null, null, now);

            await transactionRepository.AddAsync(transaction, cancellationToken);
            transactionId = transaction.Id;
        }

        await occurrenceRepository.AddAsync(new RecurringOccurrence
        {
            Id = Guid.NewGuid(),
            RecurringId = recurring.Id,
            ScheduledDate = scheduledDate,
            Status = RecurringOccurrenceStatus.AutoRegistered,
            SuggestedAmount = amount,
            RealAmount = amount,
            TransactionId = transactionId,
            ConfirmedAt = now
        }, cancellationToken);
    }

    private async Task GeneratePendingAsync(
        Recurring recurring, DateOnly scheduledDate, CancellationToken cancellationToken)
    {
        await occurrenceRepository.AddAsync(new RecurringOccurrence
        {
            Id = Guid.NewGuid(),
            RecurringId = recurring.Id,
            ScheduledDate = scheduledDate,
            Status = RecurringOccurrenceStatus.Pending,
            SuggestedAmount = recurring.AmountType == RecurringAmountType.Estimated
                ? recurring.EstimatedAmount
                : null
        }, cancellationToken);
    }

    private static DateOnly AdvanceDate(DateOnly date, RecurringFrequency frequency) => frequency switch
    {
        RecurringFrequency.Daily => date.AddDays(1),
        RecurringFrequency.Weekly => date.AddDays(7),
        RecurringFrequency.Biweekly => date.AddDays(14),
        RecurringFrequency.Monthly => date.AddMonths(1),
        RecurringFrequency.Yearly => date.AddYears(1),
        _ => throw new InvalidOperationException($"Unknown frequency '{frequency}'.")
    };
}
