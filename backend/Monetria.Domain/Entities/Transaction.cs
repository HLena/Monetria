using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }

    public TransactionType Type { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Description { get; set; }

    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }

    public void Validate()
    {
        if (string.IsNullOrEmpty(Description))
        {
            throw new InvalidOperationException("Transaction description is required.");
        }
        if (Amount <= 0)
        {
            throw new InvalidOperationException("Transaction amount must be greater than 0.");
        }
    }

    public void SetId()
    {
        Id = Guid.NewGuid();
    }
}