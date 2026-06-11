namespace Monetria.Domain.Entities;

public class SavingsPocket
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public decimal CurrentAmount { get; set; }

    public Guid? LinkedAccountId { get; set; }
    public string? Color { get; set; }
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
