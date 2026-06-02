using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class Recurring
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public Guid? ToAccountId { get; set; }
    public Guid? CategoryId { get; set; }

    public string Name { get; set; } = null!;
    public TransactionType Type { get; set; }
    public RecurringAmountType AmountType { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedAmount { get; set; }

    public RecurringFrequency Frequency { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DateOnly NextDueDate { get; set; }

    public bool IsActive { get; set; } = true;

    public Category? Category { get; set; }
    public ICollection<RecurringOccurrence> Occurrences { get; set; } = [];
}
