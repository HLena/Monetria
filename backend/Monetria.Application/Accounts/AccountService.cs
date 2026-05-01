using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.Accounts;

public sealed class AccountService(IAccountRepository accountRepository, IUnitOfWork unitOfWork) : IAccountService
{
    public async Task<AccountResponse> CreateAsync(
        CreateAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCreateRequest(request);

        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            Type = request.Type,
            InitialBalance = request.InitialBalance,
            Currency = request.Currency.Trim().ToUpperInvariant(),
            Bank = request.Bank,
            CardHolderName = request.CardHolderName,
            CardLast4Digits = request.CardLast4Digits,
            ExpiryDate = request.ExpiryDate,
            CreditLimit = request.CreditLimit,
            BillingDate = request.BillingDate,
            PaymentDay = request.PaymentDay,
            CreatedAt = DateTime.UtcNow
        };

        await accountRepository.AddAsync(account, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(account);
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
