namespace Monetria.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PreferredCurrency { get; set; } = "PEN";
    public string DateFormat { get; set; } = "DD/MM/YYYY";
    public string Theme { get; set; } = "light";
    public string? PhoneNumber { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<Account> Accounts { get; set; } = new();
}
