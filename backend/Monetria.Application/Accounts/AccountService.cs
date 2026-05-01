using Monetria.Application.Common;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public sealed class AccountService(IAccountRepository accountRepository, IUnitOfWork unitOfWork) : IAccountService
{
    public async Task<AccountResponse> CreateAsync(
        CreateAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCreateRequest(request);

        var account = CreateAccount(request);

        await accountRepository.AddAsync(account, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(account);
    }

    private static Account CreateAccount(CreateAccountRequest request)
    {
        return request.Type switch
        {
            AccountType.Cash => CreateCashAccount(request),
            AccountType.Debit => CreateDebitAccount(request),
            AccountType.Credit => CreateCreditAccount(request),
            _ => throw new ArgumentException("Invalid account type.", nameof(request))
        };
    }

    private static Account CreateDebitAccount(CreateAccountRequest request)
    {
        return new Account
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            Type = AccountType.Debit,
            InitialBalance = request.InitialBalance,
            Currency = NormalizeCurrency(request.Currency),
            Bank = request.Bank,
            CardHolderName = request.CardHolderName,
            CardLast4Digits = request.CardLast4Digits,
            ExpiryDate = request.ExpiryDate,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static Account CreateCreditAccount(CreateAccountRequest request)
    {
        return new Account
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            Type = AccountType.Credit,
            InitialBalance = request.InitialBalance,
            Currency = NormalizeCurrency(request.Currency),
            Bank = request.Bank,
            CardHolderName = request.CardHolderName,
            CardLast4Digits = request.CardLast4Digits,
            ExpiryDate = request.ExpiryDate,
            CreditLimit = request.CreditLimit,
            BillingDate = request.BillingDate,
            PaymentDay = request.PaymentDay,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static Account CreateCashAccount(CreateAccountRequest request)
    {
        return new Account
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            Type = AccountType.Cash,
            InitialBalance = request.InitialBalance,
            Currency = NormalizeCurrency(request.Currency),
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<IReadOnlyList<AccountResponse>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }

        var accounts = await accountRepository.ListByUserIdAsync(userId, cancellationToken);

        return accounts
            .Select(MapToResponse)
            .ToList();
    }

    private static void ValidateCreateRequest(CreateAccountRequest request)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.Currency))
        {
            throw new ArgumentException("Account currency is required.", nameof(request));
        }

        if (request.Currency.Trim().Length != 3)
        {
            throw new ArgumentException("Account currency must use a three-letter code.", nameof(request));
        }

        if (request.InitialBalance < 0)
        {
            throw new ArgumentException("Account initial balance cannot be negative.", nameof(request));
        }

        switch (request.Type)
        {
            case AccountType.Cash:
                ValidateCashAccount(request);
                break;
            case AccountType.Debit:
                ValidateDebitAccount(request);
                break;
            case AccountType.Credit:
                ValidateCreditAccount(request);
                break;
            default:
                throw new ArgumentException("Invalid account type.", nameof(request));
        }
    }

    private static void ValidateCashAccount(CreateAccountRequest request)
    {
        if (HasCardDetails(request) || request.CreditLimit.HasValue || request.BillingDate.HasValue || request.PaymentDay.HasValue)
        {
            throw new ArgumentException("Cash accounts cannot include card or credit details.", nameof(request));
        }
    }

    private static void ValidateDebitAccount(CreateAccountRequest request)
    {
        ValidateCardDetails(request);

        if (request.CreditLimit.HasValue || request.BillingDate.HasValue || request.PaymentDay.HasValue)
        {
            throw new ArgumentException("Debit accounts cannot include credit details.", nameof(request));
        }
    }

    private static void ValidateCreditAccount(CreateAccountRequest request)
    {
        ValidateCardDetails(request);

        if (!request.CreditLimit.HasValue || request.CreditLimit <= 0)
        {
            throw new ArgumentException("Credit limit is required for credit accounts.", nameof(request));
        }

        if (!request.BillingDate.HasValue || request.BillingDate < 1 || request.BillingDate > 31)
        {
            throw new ArgumentException("Billing date must be between 1 and 31.", nameof(request));
        }

        if (!request.PaymentDay.HasValue || request.PaymentDay < 1 || request.PaymentDay > 31)
        {
            throw new ArgumentException("Payment day must be between 1 and 31.", nameof(request));
        }
    }

    private static void ValidateCardDetails(CreateAccountRequest request)
    {
        if (request.CardLast4Digits is not null && !IsValidLast4Digits(request.CardLast4Digits))
        {
            throw new ArgumentException("Card last 4 digits must contain exactly four digits.", nameof(request));
        }
    }

    private static bool HasCardDetails(CreateAccountRequest request)
    {
        return !string.IsNullOrWhiteSpace(request.Bank)
            || !string.IsNullOrWhiteSpace(request.CardHolderName)
            || !string.IsNullOrWhiteSpace(request.CardLast4Digits)
            || !string.IsNullOrWhiteSpace(request.ExpiryDate);
    }

    private static bool IsValidLast4Digits(string cardLast4Digits)
    {
        return cardLast4Digits.Length == 4 && cardLast4Digits.All(char.IsDigit);
    }

    private static string NormalizeCurrency(string currency)
    {
        return currency.Trim().ToUpperInvariant();
    }

    private static AccountResponse MapToResponse(Account account)
    {
        return new AccountResponse(
            account.Id,
            account.UserId,
            account.Name,
            account.Type,
            account.InitialBalance,
            account.Currency,
            account.Bank,
            account.CardLast4Digits,
            account.CreditLimit,
            account.CreatedAt);
    }
}
