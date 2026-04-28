public class Transaction
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }

    public TransactionType Type { get; set; }
    public string Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }

    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }

    public void Validate()
    {
        if (string.IsNullOrEmpty(Description))
        {
            throw new Exception("Description is required");
        }
        if (Amount <= 0)
        {
            throw new Exception("Amount must be greater than 0");
        }
    }

    public void SetId()
    {
        Id = Guid.NewGuid();
    }
}