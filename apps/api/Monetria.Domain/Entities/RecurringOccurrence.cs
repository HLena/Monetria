using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class RecurringOccurrence
{
    public Guid Id { get; set; }
    public Guid RecurringId { get; set; }

    public DateOnly ScheduledDate { get; set; }
    public RecurringOccurrenceStatus Status { get; set; }
    public decimal? SuggestedAmount { get; set; }
    public decimal? RealAmount { get; set; }
    public Guid? TransactionId { get; set; }
    public DateTime? ConfirmedAt { get; set; }

    public Recurring Recurring { get; set; } = null!;
}
