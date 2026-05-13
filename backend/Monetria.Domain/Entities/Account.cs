using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class Account
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public decimal InitialBalance { get; set; }
    public string CurrencyCode { get; set; } = "PEN";
    public bool IsActive { get; set; } = true;
    public string ColorCode { get; set; } = "#000000";

    // Visual / institution metadata
    public string? InstitutionName { get; set; }
    public string? CardLast4Digits { get; set; }
    // Credit card only
    public decimal? CreditLimit { get; set; }
    public string? CardHolderName { get; set; }
    public int? ClosingDay { get; set; }
    public int? DueDay { get; set; }

    // Wallet only
    public string? ProviderName { get; set; }
    
    public int? BillingDate { get; set; }
    public int? PaymentDay { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

