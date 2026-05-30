using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class Budget
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Category { get; set; } = null!;
    public decimal LimitAmount { get; set; }

    public BudgetPeriod Period { get; set; }

    public DateTime CreatedAt { get; set; }
}