using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }

    public TransactionType Type { get; set; }
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public Guid? TransferAccountId { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }
}