using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class FixedExpense
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }

    public string Name { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Category { get; set; } = null!;

    public ExpensePeriod Period { get; set; }
    public int? DueDay { get; set; }

    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}