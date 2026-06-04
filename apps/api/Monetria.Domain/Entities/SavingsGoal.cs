namespace Monetria.Domain.Entities;

public class SavingsGoal
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }

    public Guid? LinkedAccountId { get; set; }
    public bool IsCompleted { get; set; }

    public DateTime? TargetDate { get; set; }

    public string? Category { get; set; }
    public string? Color { get; set; }
    public string? Description { get; set; }
}
