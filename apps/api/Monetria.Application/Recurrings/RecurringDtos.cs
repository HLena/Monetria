using Monetria.Domain.Enums;

namespace Monetria.Application.Recurrings;

public sealed record RecurringOccurrenceResponse(
    Guid Id,
    Guid RecurringId,
    DateOnly ScheduledDate,
    RecurringOccurrenceStatus Status,
    decimal? SuggestedAmount,
    decimal? RealAmount,
    Guid? TransactionId,
    DateTime? ConfirmedAt);

public sealed record ConfirmOccurrenceRequest(decimal? RealAmount);

public sealed record CreateRecurringRequest(
    Guid AccountId,
    Guid? ToAccountId,
    Guid? CategoryId,
    string Name,
    TransactionType Type,
    RecurringAmountType AmountType,
    decimal? Amount,
    decimal? EstimatedAmount,
    RecurringFrequency Frequency,
    DateOnly StartDate,
    DateOnly? EndDate,
    DateOnly NextDueDate);

public sealed record UpdateRecurringRequest(
    Guid AccountId,
    Guid? ToAccountId,
    Guid? CategoryId,
    string Name,
    TransactionType Type,
    RecurringAmountType AmountType,
    decimal? Amount,
    decimal? EstimatedAmount,
    RecurringFrequency Frequency,
    DateOnly StartDate,
    DateOnly? EndDate,
    DateOnly NextDueDate,
    bool IsActive);

public sealed record RecurringResponse(
    Guid Id,
    Guid UserId,
    Guid AccountId,
    Guid? ToAccountId,
    Guid? CategoryId,
    string? CategoryName,
    string Name,
    TransactionType Type,
    RecurringAmountType AmountType,
    decimal? Amount,
    decimal? EstimatedAmount,
    RecurringFrequency Frequency,
    DateOnly StartDate,
    DateOnly? EndDate,
    DateOnly NextDueDate,
    bool IsActive);
