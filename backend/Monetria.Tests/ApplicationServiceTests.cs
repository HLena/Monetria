using Microsoft.EntityFrameworkCore;
using Monetria.Application.Accounts;
using Monetria.Application.Auth;
using Monetria.Application.Categories;
using Monetria.Application.Transactions;
using Monetria.Application.Users;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
using Monetria.Infrastructure.Accounts;
using Monetria.Infrastructure.Auth;
using Monetria.Infrastructure.Categories;
using Monetria.Infrastructure.Persistence;
using Monetria.Infrastructure.Transactions;
using Monetria.Infrastructure.Users;

namespace Monetria.Tests;

public sealed class ApplicationServiceTests
{
    private const string Password = "SecurePassword123";

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var authService = CreateAuthService(dbContext);
        var request = new RegisterRequest("Test", "User", "duplicate@example.com", Password);
        await authService.RegisterAsync(request);

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => authService.RegisterAsync(request));

        Assert.Equal("Email already exists. (Parameter 'request')", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var authService = CreateAuthService(dbContext);
        await authService.RegisterAsync(new RegisterRequest("Login", "User", "login@example.com", Password));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.LoginAsync(new LoginRequest("login@example.com", "WrongPassword123")));
    }

    [Fact]
    public async Task CreateAccountAsync_WhenCreditLimitIsMissing_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = CreateCreditAccountRequest(creditLimit: null);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task CreateBankAccountAsync_WithInstitutionName_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "BBVA Débito",
            Type: AccountType.BankAccount,
            InitialBalance: 500,
            CurrencyCode: "PEN",
            InstitutionName: "BBVA",
            CardHolderName: "TEST USER",
            CardLast4Digits: "1234",
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: null);

        var result = await service.CreateAsync(Guid.NewGuid(), request);

        Assert.Equal("BBVA", result.InstitutionName);
    }

    [Fact]
    public async Task CreateCreditCardAsync_WithInstitutionName_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = CreateCreditAccountRequest(creditLimit: 5000);

        var result = await service.CreateAsync(Guid.NewGuid(), request);

        Assert.Equal("Bank", result.InstitutionName);
    }

    [Fact]
    public async Task CreateEWalletAsync_WithProviderAsInstitutionName_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Mi PayPal",
            Type: AccountType.EWallet,
            InitialBalance: 0,
            CurrencyCode: "USD",
            InstitutionName: "PayPal",
            CardHolderName: null,
            CardLast4Digits: null,
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: null);

        var result = await service.CreateAsync(Guid.NewGuid(), request);

        Assert.Equal("PayPal", result.InstitutionName);
    }

    [Fact]
    public async Task CreateCashAccountAsync_WithInstitutionName_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Efectivo",
            Type: AccountType.Cash,
            InitialBalance: 100,
            CurrencyCode: "PEN",
            InstitutionName: "Banco",
            CardHolderName: null,
            CardLast4Digits: null,
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: null);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task CreateCategoryAsync_WhenNameExistsForUserAndType_ThrowsInvalidOperationException()
    {
        await using var dbContext = CreateDbContext();
        var service = new CategoryService(new CategoryRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var userId = Guid.NewGuid();
        var request = new CreateCategoryRequest("Food", TransactionType.Expense, "#F97316");
        await service.CreateAsync(userId, request);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(userId, request with { Name = " food " }));
    }

    [Fact]
    public async Task CreateTransactionAsync_WhenAccountBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var account = AddAccount(dbContext, ownerId, AccountType.Cash);
        var category = AddCategory(dbContext, requesterId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.CreateAsync(requesterId, request));
    }

    [Fact]
    public async Task CreateTransactionAsync_WhenCategoryTypeDoesNotMatch_ThrowsInvalidOperationException()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Income);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(userId, request));
    }

    [Fact]
    public async Task CreateTransactionAsync_WhenCreditLimitWouldBeExceeded_RejectsWithoutChangingInitialBalance()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.CreditCard, creditLimit: 100);
        var category = AddCategory(dbContext, userId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense, amount: 101);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(userId, request));

        var unchangedAccount = await dbContext.Accounts.SingleAsync(savedAccount => savedAccount.Id == account.Id);
        Assert.Equal(0, unchangedAccount.InitialBalance);
        Assert.Empty(dbContext.Transactions);
    }

    [Fact]
    public async Task CreateTransactionAsync_WithValidCategory_PersistsStrongCategoryLink()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense, name: "Groceries");
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense, amount: 25);

        var response = await service.CreateAsync(userId, request);

        Assert.Equal(category.Id, response.CategoryId);
        Assert.Equal("Groceries", response.CategoryName);
        Assert.Equal(0, account.InitialBalance);
        Assert.True(await dbContext.Transactions.AnyAsync(transaction =>
            transaction.Id == response.Id && transaction.CategoryId == category.Id));
    }

    private static MonetriaDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<MonetriaDbContext>()
            .UseInMemoryDatabase($"MonetriaApplicationTests-{Guid.NewGuid()}")
            .Options;

        return new MonetriaDbContext(options);
    }

    private static AuthService CreateAuthService(MonetriaDbContext dbContext)
    {
        return new AuthService(
            new UserRepository(dbContext),
            new MonetriaUnitOfWork(dbContext),
            new PasswordService(),
            new TestJwtTokenGenerator());
    }

    private static TransactionService CreateTransactionService(MonetriaDbContext dbContext)
    {
        return new TransactionService(
            new TransactionRepository(dbContext),
            new AccountRepository(dbContext),
            new CategoryRepository(dbContext),
            new MonetriaUnitOfWork(dbContext));
    }

    private static CreateAccountRequest CreateCreditAccountRequest(decimal? creditLimit)
    {
        return new CreateAccountRequest(
            Name: "Credit Card",
            Type: AccountType.CreditCard,
            InitialBalance: 0,
            CurrencyCode: "PEN",
            InstitutionName: "Bank",
            CardHolderName: "Test User",
            CardLast4Digits: "1234",
            CreditLimit: creditLimit,
            StatementClosingDay: 10,
            PaymentDueDay: 25,
            ColorCode: null);
    }

    [Fact]
    public async Task CreateTransactionAsync_WithValidExpense_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense, name: "Food");
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense, amount: 50);

        var response = await service.CreateAsync(userId, request);

        Assert.Equal(TransactionType.Expense, response.Type);
        Assert.Equal(50, response.Amount);
        Assert.True(response.IsActive);
    }

    [Fact]
    public async Task CreateTransactionAsync_WithValidIncome_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Income, name: "Salary");
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Income, amount: 1000);

        var response = await service.CreateAsync(userId, request);

        Assert.Equal(TransactionType.Income, response.Type);
        Assert.Equal(1000, response.Amount);
    }

    [Fact]
    public async Task CreateTransactionAsync_WithNegativeAmount_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense, amount: -10);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(userId, request));
    }

    [Fact]
    public async Task CreateTransactionAsync_WithInactiveCategory_ThrowsInvalidOperationException()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense);
        category.IsActive = false;
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(userId, request));
    }

    [Fact]
    public async Task CreateTransactionAsync_WithTransferMissingTransferAccountId_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = new CreateTransactionRequest(
            account.Id,
            TransactionType.Transfer,
            null,
            100,
            "Transfer test",
            DateTime.UtcNow,
            TransferAccountId: null);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(userId, request));
    }

    [Fact]
    public async Task CreateTransactionAsync_WithValidTransfer_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var sourceAccount = AddAccount(dbContext, userId, AccountType.Cash);
        var destAccount = AddAccount(dbContext, userId, AccountType.BankAccount);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var request = new CreateTransactionRequest(
            sourceAccount.Id,
            TransactionType.Transfer,
            null,
            200,
            "Transfer to savings",
            DateTime.UtcNow,
            TransferAccountId: destAccount.Id);

        var response = await service.CreateAsync(userId, request);

        Assert.Equal(TransactionType.Transfer, response.Type);
        Assert.Equal(destAccount.Id, response.TransferAccountId);
        Assert.True(response.IsActive);
    }

    [Fact]
    public async Task DeleteTransactionAsync_SetsIsActiveToFalse()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var created = await service.CreateAsync(userId,
            CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense));

        await service.DeleteAsync(userId, created.Id);

        var transaction = await dbContext.Transactions.FindAsync(created.Id);
        Assert.NotNull(transaction);
        Assert.False(transaction!.IsActive);
    }

    [Fact]
    public async Task GetTransactionAsync_WhenBelongsToUser_ReturnsResponse()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var created = await service.CreateAsync(userId, CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense));

        var response = await service.GetByIdAsync(userId, created.Id);

        Assert.Equal(created.Id, response.Id);
    }

    [Fact]
    public async Task GetTransactionAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var account = AddAccount(dbContext, ownerId, AccountType.Cash);
        var category = AddCategory(dbContext, ownerId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var created = await service.CreateAsync(ownerId, CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetByIdAsync(requesterId, created.Id));
    }

    [Fact]
    public async Task UpdateTransactionAsync_WithValidFields_UpdatesCorrectly()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var created = await service.CreateAsync(userId, CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense, amount: 10));

        var updateRequest = new UpdateTransactionRequest(99, category.Id, DateTime.UtcNow, "Updated", account.Id);
        var updated = await service.UpdateAsync(userId, created.Id, updateRequest);

        Assert.Equal(99, updated.Amount);
        Assert.Equal("Updated", updated.Description);
    }

    [Fact]
    public async Task UpdateTransactionAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var account = AddAccount(dbContext, ownerId, AccountType.Cash);
        var category = AddCategory(dbContext, ownerId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var created = await service.CreateAsync(ownerId, CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense));

        var updateRequest = new UpdateTransactionRequest(50, category.Id, DateTime.UtcNow, null, account.Id);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateAsync(requesterId, created.Id, updateRequest));
    }

    [Fact]
    public async Task DeleteTransactionAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var account = AddAccount(dbContext, ownerId, AccountType.Cash);
        var category = AddCategory(dbContext, ownerId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var created = await service.CreateAsync(ownerId, CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.DeleteAsync(requesterId, created.Id));
    }

    [Fact]
    public async Task ListTransactionsAsync_DoesNotReturnDeletedTransactions()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Expense);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var created = await service.CreateAsync(userId, CreateTransactionRequest(account.Id, category.Id, TransactionType.Expense));
        await service.DeleteAsync(userId, created.Id);

        var list = await service.ListByUserIdAsync(userId, new TransactionFilterRequest());

        Assert.Empty(list);
    }

    private static CreateTransactionRequest CreateTransactionRequest(
        Guid accountId,
        Guid categoryId,
        TransactionType type,
        decimal amount = 10)
    {
        return new CreateTransactionRequest(
            accountId,
            type,
            categoryId,
            amount,
            "Test transaction",
            DateTime.UtcNow);
    }

    private static Account AddAccount(
        MonetriaDbContext dbContext,
        Guid userId,
        AccountType type,
        decimal? creditLimit = null)
    {
        var now = DateTime.UtcNow;
        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = "Test account",
            Type = type,
            InitialBalance = 0,
            CurrencyCode = "PEN",
            CreditLimit = creditLimit,
            StatementClosingDay = type == AccountType.CreditCard ? 10 : null,
            PaymentDueDay = type == AccountType.CreditCard ? 25 : null,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Accounts.Add(account);

        return account;
    }

    private static Category AddCategory(
        MonetriaDbContext dbContext,
        Guid? userId,
        TransactionType type,
        string name = "Category")
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Type = type,
            Color = "#64748B",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Categories.Add(category);

        return category;
    }

    private sealed class TestJwtTokenGenerator : IJwtTokenGenerator
    {
        public string GenerateToken(User user)
        {
            return $"test-token-{user.Id}";
        }
    }
}
