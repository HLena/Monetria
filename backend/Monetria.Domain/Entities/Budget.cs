public class Budget
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Category { get; set; } = null!;
    public decimal LimitAmount { get; set; }

    public BudgetPeriod Period { get; set; } = null!; // monthly | weekly

    public DateTime CreatedAt { get; set; }
}