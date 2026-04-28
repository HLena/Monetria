public class Debt
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;
    public string? Creditor { get; set; }

    public decimal OriginalAmount { get; set; }
    public decimal RemainingAmount { get; set; }

    public decimal InterestRate { get; set; }
    public decimal MinimumPayment { get; set; }

    public DateTime? NextPaymentDate { get; set; }

    public string? Type { get; set; }
}