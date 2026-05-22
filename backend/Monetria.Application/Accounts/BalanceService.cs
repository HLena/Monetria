using Monetria.Application.Common;
using Monetria.Application.Transactions;
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

        var incomeFilter = new TransactionFilterRequest(Type: TransactionType.Income);
        var incomeTransactions = await transactionRepository.ListByUserIdAsync(
            userId, incomeFilter, cancellationToken);

        var expenseFilter = new TransactionFilterRequest(Type: TransactionType.Expense);
        var expenseTransactions = await transactionRepository.ListByUserIdAsync(
            userId, expenseFilter, cancellationToken);

        var totalIncome = incomeTransactions.Sum(t => t.Amount);
        var totalExpense = expenseTransactions.Sum(t => t.Amount);
        var balance = totalIncome - totalExpense;

        var currencyCode = await GetUserCurrencyAsync(userId, cancellationToken);

        return new UserBalanceResponse(totalIncome, totalExpense, balance, currencyCode);
    }

    private async Task<string> GetUserCurrencyAsync(Guid userId, CancellationToken cancellationToken)
    {
        var userAccounts = await accountRepository.ListByUserIdAsync(userId, null, cancellationToken);
        return userAccounts.FirstOrDefault()?.CurrencyCode ?? "PEN";
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }
}
