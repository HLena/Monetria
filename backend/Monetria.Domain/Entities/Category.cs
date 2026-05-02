using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Name { get; set; } = null!;
    public TransactionType Type { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<Transaction> Transactions { get; set; } = new();
}