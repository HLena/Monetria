namespace Monetria.Application.Accounts;

public sealed record UserBalanceResponse(
    decimal TotalIncome,
    decimal TotalExpense,
    decimal Balance,
    string CurrencyCode);
