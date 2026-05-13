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
        var service = new AccountService(new AccountRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = CreateCreditAccountRequest(creditLimit: null);

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
            ProviderName: null,
            ColorCode: null);
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
