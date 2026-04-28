public class FixedExpense
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }

    public string Name { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Category { get; set; } = null!;

    public string Period { get; set; } = null!; // monthly, weekly, yearly
    public int? DueDay { get; set; }

    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}