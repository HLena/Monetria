using Monetria.Application.Common;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Accounts;

public sealed class AccountService(IAccountRepository accountRepository, IUnitOfWork unitOfWork) : IAccountService
{
    public async Task<AccountResponse> CreateAsync(
        Guid userId,
        CreateAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateCreateRequest(request);

        var account = CreateAccount(userId, request);

        await accountRepository.AddAsync(account, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(account);
    }

    private static Account CreateAccount(Guid userId, CreateAccountRequest request)
    {
        return request.Type switch
        {
            AccountType.Cash => CreateCashAccount(userId, request),
            AccountType.BankAccount => CreateBankAccount(userId, request),
            AccountType.CreditCard => CreateCreditCardAccount(userId, request),
            AccountType.EWallet => CreateEWalletAccount(userId, request),
            AccountType.Savings => CreateSavingsAccount(userId, request),
            _ => throw new ArgumentException("Invalid account type.", nameof(request))
        };
    }

    private static Account CreateBaseAccount(Guid userId, CreateAccountRequest request, AccountType type)
    {
        var now = DateTime.UtcNow;
        return new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name ?? string.Empty,
            Type = type,
            InitialBalance = request.InitialBalance,
            CurrencyCode = NormalizeCurrency(request.CurrencyCode),
            ColorCode = NormalizeColor(request.ColorCode),
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static Account CreateBankAccount(Guid userId, CreateAccountRequest request)
    {
        var account = CreateBaseAccount(userId, request, AccountType.BankAccount);
        account.InstitutionName = request.InstitutionName;
        account.CardHolderName = request.CardHolderName;
        account.CardLast4Digits = request.CardLast4Digits;
        return account;
    }

    private static Account CreateCreditCardAccount(Guid userId, CreateAccountRequest request)
    {
        var account = CreateBaseAccount(userId, request, AccountType.CreditCard);
        account.InstitutionName = request.InstitutionName;
        account.CardHolderName = request.CardHolderName;
        account.CardLast4Digits = request.CardLast4Digits;
        account.CreditLimit = request.CreditLimit;
        account.StatementClosingDay = request.StatementClosingDay;
        account.PaymentDueDay = request.PaymentDueDay;
        return account;
    }

    private static Account CreateCashAccount(Guid userId, CreateAccountRequest request)
    {
        return CreateBaseAccount(userId, request, AccountType.Cash);
    }

    private static Account CreateEWalletAccount(Guid userId, CreateAccountRequest request)
    {
        var account = CreateBaseAccount(userId, request, AccountType.EWallet);
        account.ProviderName = request.ProviderName;
        return account;
    }

    private static Account CreateSavingsAccount(Guid userId, CreateAccountRequest request)
    {
        return CreateBaseAccount(userId, request, AccountType.Savings);
    }

    public async Task<IReadOnlyList<AccountResponse>> ListByUserIdAsync(
        Guid userId,
        AccountType? type = null,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }

        var accounts = await accountRepository.ListByUserIdAsync(userId, type, cancellationToken);

        return accounts
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<AccountResponse> UpdateAsync(
        Guid userId,
        Guid accountId,
        UpdateAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new KeyNotFoundException($"Account {accountId} not found.");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("Account does not belong to the current user.");

        account.Name = request.Name?.Trim() ?? account.Name;
        account.InitialBalance = request.InitialBalance;
        account.CurrencyCode = NormalizeCurrency(request.CurrencyCode ?? account.CurrencyCode);
        account.ColorCode = NormalizeColor(request.ColorCode ?? account.ColorCode);
        account.InstitutionName = request.InstitutionName;
        account.CardHolderName = request.CardHolderName;
        account.CardLast4Digits = request.CardLast4Digits;
        account.CreditLimit = request.CreditLimit;
        account.StatementClosingDay = request.StatementClosingDay;
        account.PaymentDueDay = request.PaymentDueDay;
        account.UpdatedAt = DateTime.UtcNow;

        await accountRepository.UpdateAsync(account, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(account);
    }

    public async Task DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new KeyNotFoundException($"Account {accountId} not found.");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("Account does not belong to the current user.");

        await accountRepository.DeleteAsync(accountId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateCreateRequest(CreateAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrencyCode))
        {
            throw new ArgumentException("Account currency is required.", nameof(request));
        }

        if (request.CurrencyCode.Trim().Length != 3)
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
            case AccountType.BankAccount:
                ValidateBankAccount(request);
                break;
            case AccountType.CreditCard:
                ValidateCreditCardAccount(request);
                break;
            case AccountType.EWallet:
                ValidateEWalletAccount(request);
                break;
            case AccountType.Savings:
                ValidateSavingsAccount(request);
                break;
            default:
                throw new ArgumentException("Invalid account type.", nameof(request));
        }
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static void ValidateCashAccount(CreateAccountRequest request)
    {
        if (HasCardOrCreditDetails(request) || !string.IsNullOrWhiteSpace(request.ProviderName))
        {
            throw new ArgumentException("Cash accounts cannot include card, credit, or wallet details.", nameof(request));
        }
    }

    private static void ValidateSavingsAccount(CreateAccountRequest request)
    {
        if (HasCardOrCreditDetails(request) || !string.IsNullOrWhiteSpace(request.ProviderName))
        {
            throw new ArgumentException("Savings accounts cannot include card, credit, or wallet details.", nameof(request));
        }
    }

    private static void ValidateBankAccount(CreateAccountRequest request)
    {
        ValidateCardDetails(request);

        if (request.CreditLimit.HasValue || request.StatementClosingDay.HasValue || request.StatementClosingDay.HasValue)
        {
            throw new ArgumentException("Bank accounts cannot include credit billing details.", nameof(request));
        }

        if (!string.IsNullOrWhiteSpace(request.ProviderName))
        {
            throw new ArgumentException("Bank accounts cannot include a wallet provider.", nameof(request));
        }
    }

    private static void ValidateCreditCardAccount(CreateAccountRequest request)
    {
        ValidateCardDetails(request);

        if (!request.CreditLimit.HasValue || request.CreditLimit <= 0)
        {
            throw new ArgumentException("Credit limit is required for credit card accounts.", nameof(request));
        }

        if (!request.StatementClosingDay.HasValue || request.StatementClosingDay < 1 || request.StatementClosingDay > 31)
        {
            throw new ArgumentException("Billing date must be between 1 and 31.", nameof(request));
        }

        if (!request.PaymentDueDay.HasValue || request.PaymentDueDay < 1 || request.PaymentDueDay > 31)
        {
            throw new ArgumentException("Payment day must be between 1 and 31.", nameof(request));
        }

        if (!string.IsNullOrWhiteSpace(request.ProviderName))
        {
            throw new ArgumentException("Credit card accounts cannot include a wallet provider.", nameof(request));
        }
    }

    private static void ValidateEWalletAccount(CreateAccountRequest request)
    {
        if (HasCardOrCreditDetails(request))
        {
            throw new ArgumentException("E-wallet accounts cannot include card or credit billing details.", nameof(request));
        }
    }

    private static void ValidateCardDetails(CreateAccountRequest request)
    {
        if (request.CardLast4Digits is not null && !IsValidLast4Digits(request.CardLast4Digits))
        {
            throw new ArgumentException("Card last 4 digits must contain exactly four digits.", nameof(request));
        }
    }

    private static bool HasCardOrCreditDetails(CreateAccountRequest request)
    {
        return !string.IsNullOrWhiteSpace(request.InstitutionName)
            || !string.IsNullOrWhiteSpace(request.CardHolderName)
            || !string.IsNullOrWhiteSpace(request.CardLast4Digits)
            || request.CreditLimit.HasValue
            || request.StatementClosingDay.HasValue
            || request.StatementClosingDay.HasValue;
    }

    private static bool IsValidLast4Digits(string cardLast4Digits)
    {
        return cardLast4Digits.Length == 4 && cardLast4Digits.All(char.IsDigit);
    }

    private static string NormalizeCurrency(string currency)
    {
        return currency.Trim().ToUpperInvariant();
    }

    private static string NormalizeColor(string? colorCode)
    {
        if (string.IsNullOrWhiteSpace(colorCode))
        {
            return "#000000";
        }

        return colorCode.Trim();
    }

    private static AccountResponse MapToResponse(Account account)
    {
        return new AccountResponse(
            account.Id,
            account.UserId,
            account.Name,
            account.Type,
            account.InitialBalance,
            account.CurrencyCode,
            account.InstitutionName,
            account.CardLast4Digits,
            account.CreditLimit,
            account.IsActive,
            account.ColorCode,
            account.CreatedAt,
            account.UpdatedAt);
    }
}
