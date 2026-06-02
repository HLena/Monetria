using Monetria.Application.Common;
using Monetria.Application.Transactions;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public sealed class BalanceService(
    ITransactionRepository transactionRepository,
    IAccountRepository accountRepository) : IBalanceService
{
    public async Task<UserBalanceResponse> GetUserBalanceAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var accounts = await accountRepository.ListByUserIdAsync(userId, null, cancellationToken);
        var activeAccounts = accounts.Where(a => a.IsActive).ToList();

        var totalBalance = 0m;
        foreach (var account in activeAccounts)
        {
            totalBalance += await GetAccountBalanceAsync(account, cancellationToken);
        }

        // Ingresos y gastos globales (para el resumen)
        var incomeFilter = new TransactionFilterRequest(Type: TransactionType.Income);
        var incomeTransactions = await transactionRepository.ListByUserIdAsync(
            userId, incomeFilter, cancellationToken);

        var expenseFilter = new TransactionFilterRequest(Type: TransactionType.Expense);
        var expenseTransactions = await transactionRepository.ListByUserIdAsync(
            userId, expenseFilter, cancellationToken);

        var totalIncome = incomeTransactions.Sum(t => t.Amount);
        var totalExpense = expenseTransactions.Sum(t => t.Amount);

        var currencyCode = activeAccounts.FirstOrDefault()?.CurrencyCode ?? "PEN";

        return new UserBalanceResponse(totalIncome, totalExpense, totalBalance, currencyCode);
    }

    public async Task<decimal> GetAccountBalanceAsync(
        Account account,
        CancellationToken cancellationToken = default)
    {
        var incomeFilter = new TransactionFilterRequest(Type: TransactionType.Income, FromAccountId: account.Id);
        var incomes = await transactionRepository.ListByUserIdAsync(
            account.UserId, incomeFilter, cancellationToken);

        var expenseFilter = new TransactionFilterRequest(Type: TransactionType.Expense, FromAccountId: account.Id);
        var expenses = await transactionRepository.ListByUserIdAsync(
            account.UserId, expenseFilter, cancellationToken);

        return account.InitialBalance.GetValueOrDefault(0) + incomes.Sum(t => t.Amount) - expenses.Sum(t => t.Amount);
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }
}
