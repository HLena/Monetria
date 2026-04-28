 public class SavingsGoal
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }

    public DateTime? TargetDate { get; set; }

    public string? Category { get; set; }
    public string? Color { get; set; }
    public string? Description { get; set; }
}