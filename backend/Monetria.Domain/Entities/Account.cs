public class Account
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string? Name { get; set; }
    public string Type { get; set; } //credit, debit, cash
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "PEN";

    public string? Bank { get; set; }

    public string? CardHolderName { get; set; }
    public string? cardLast4Digits { get; set; }
    public string? ExpiryDate { get; set; }
    
    public decimal? CreditLimit { get; set; }
    public int? BillingDate { get; set; }
    public int? PaymentDay { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<Transaction> Transactions { get; set; } = new();
}