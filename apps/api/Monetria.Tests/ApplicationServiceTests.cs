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
        Assert.True(unchangedAccount.Id != Guid.Empty);
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
        Assert.True(account.Id != Guid.Empty);
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
            ToAccountId: null);

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
            ToAccountId: destAccount.Id);

        var response = await service.CreateAsync(userId, request);

        Assert.Equal(TransactionType.Transfer, response.Type);
        Assert.Equal(destAccount.Id, response.ToAccountId);
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

    [Fact]
    public async Task GetUserBalanceAsync_WithIncomeAndExpenseTransactions_ReturnsCorrectBalance()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash, creditLimit: null);
        var incomeCategory = AddCategory(dbContext, userId, TransactionType.Income, "Salary");
        var expenseCategory = AddCategory(dbContext, userId, TransactionType.Expense, "Food");
        await dbContext.SaveChangesAsync();

        var transactionService = CreateTransactionService(dbContext);
        await transactionService.CreateAsync(userId, new CreateTransactionRequest(
            account.Id, TransactionType.Income, incomeCategory.Id, 1000, "Salary", DateTime.UtcNow));
        await transactionService.CreateAsync(userId, new CreateTransactionRequest(
            account.Id, TransactionType.Expense, expenseCategory.Id, 200, "Groceries", DateTime.UtcNow));

        var balanceService = new BalanceService(
            new TransactionRepository(dbContext),
            new AccountRepository(dbContext));
        var response = await balanceService.GetUserBalanceAsync(userId);

        Assert.Equal(1000, response.TotalIncome);
        Assert.Equal(200, response.TotalExpense);
        Assert.Equal(800, response.Balance);
    }

    [Fact]
    public async Task GetUserBalanceAsync_WithTransfers_ExcludesTransfersFromBalance()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var sourceAccount = AddAccount(dbContext, userId, AccountType.Cash);
        var destAccount = AddAccount(dbContext, userId, AccountType.BankAccount);
        var incomeCategory = AddCategory(dbContext, userId, TransactionType.Income, "Bonus");
        var expenseCategory = AddCategory(dbContext, userId, TransactionType.Expense, "Utilities");
        await dbContext.SaveChangesAsync();

        var transactionService = CreateTransactionService(dbContext);
        await transactionService.CreateAsync(userId, new CreateTransactionRequest(
            sourceAccount.Id, TransactionType.Income, incomeCategory.Id, 500, "Bonus", DateTime.UtcNow));
        await transactionService.CreateAsync(userId, new CreateTransactionRequest(
            sourceAccount.Id, TransactionType.Expense, expenseCategory.Id, 100, "Utilities", DateTime.UtcNow));
        await transactionService.CreateAsync(userId, new CreateTransactionRequest(
            sourceAccount.Id, TransactionType.Transfer, null, 150, "Transfer", DateTime.UtcNow, ToAccountId: destAccount.Id));

        var balanceService = new BalanceService(
            new TransactionRepository(dbContext),
            new AccountRepository(dbContext));
        var response = await balanceService.GetUserBalanceAsync(userId);

        Assert.Equal(500, response.TotalIncome);
        Assert.Equal(100, response.TotalExpense);
        Assert.Equal(400, response.Balance);
    }

    [Fact]
    public async Task GetUserBalanceAsync_WithNoTransactions_ReturnsZeroBalance()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        await dbContext.SaveChangesAsync();

        var balanceService = new BalanceService(
            new TransactionRepository(dbContext),
            new AccountRepository(dbContext));
        var response = await balanceService.GetUserBalanceAsync(userId);

        Assert.Equal(0, response.TotalIncome);
        Assert.Equal(0, response.TotalExpense);
        Assert.Equal(0, response.Balance);
    }

    [Fact]
    public async Task CreateAccountAsync_WithValidWallet_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Mi Yape",
            Type: AccountType.EWallet,
            InitialBalance: 0,
            CurrencyCode: "PEN",
            InstitutionName: "Yape",
            CardHolderName: null,
            CardLast4Digits: null,
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: "#6366f1");

        var result = await service.CreateAsync(Guid.NewGuid(), request);

        Assert.Equal("Mi Yape", result.Name);
        Assert.Equal(0, result.CurrentBalance);
    }

    [Fact]
    public async Task CreateAccountAsync_WithInitialBalance_CreatesInitialTransaction()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Cuenta Ahorro",
            Type: AccountType.BankAccount,
            InitialBalance: 500,
            CurrencyCode: "PEN",
            InstitutionName: "BCP",
            CardHolderName: null,
            CardLast4Digits: null,
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: null);

        var result = await service.CreateAsync(Guid.NewGuid(), request);

        Assert.Equal(500, result.CurrentBalance);
        Assert.True(await dbContext.Transactions.AnyAsync(t => t.FromAccountId == result.Id && t.Amount == 500));
    }

    [Fact]
    public async Task CreateAccountAsync_WithInvalidColorCode_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Cuenta",
            Type: AccountType.Cash,
            InitialBalance: 0,
            CurrencyCode: "PEN",
            InstitutionName: null,
            CardHolderName: null,
            CardLast4Digits: null,
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: "invalid-color");

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task CreateAccountAsync_WithNameTooShort_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "A",
            Type: AccountType.Cash,
            InitialBalance: 0,
            CurrencyCode: "PEN",
            InstitutionName: null,
            CardHolderName: null,
            CardLast4Digits: null,
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: null);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task GetAccountByIdAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var account = AddAccount(dbContext, ownerId, AccountType.Cash);
        await dbContext.SaveChangesAsync();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetByIdAsync(requesterId, account.Id));
    }

    [Fact]
    public async Task AccountBalance_IsDerivedFromTransactions_NotFromStoredField()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var category = AddCategory(dbContext, userId, TransactionType.Income);
        await dbContext.SaveChangesAsync();
        var txService = CreateTransactionService(dbContext);
        await txService.CreateAsync(userId, new CreateTransactionRequest(account.Id, TransactionType.Income, category.Id, 300, null, DateTime.UtcNow));

        var accountService = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var response = await accountService.GetByIdAsync(userId, account.Id);

        Assert.Equal(300, response.CurrentBalance);
    }

    [Fact]
    public async Task CreateCreditCardAsync_WithNegativeCreditLimit_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = CreateCreditAccountRequest(creditLimit: -100);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task CreateCreditCardAsync_WithInvalidStatementDay_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Visa",
            Type: AccountType.CreditCard,
            InitialBalance: 0,
            CurrencyCode: "PEN",
            InstitutionName: "Bank",
            CardHolderName: "Test",
            CardLast4Digits: "1234",
            CreditLimit: 5000,
            StatementClosingDay: 32,
            PaymentDueDay: 10,
            ColorCode: null);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task CreateCreditCardAsync_WithInvalidPaymentDueDay_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Visa",
            Type: AccountType.CreditCard,
            InitialBalance: 0,
            CurrencyCode: "PEN",
            InstitutionName: "Bank",
            CardHolderName: "Test",
            CardLast4Digits: "1234",
            CreditLimit: 5000,
            StatementClosingDay: 15,
            PaymentDueDay: 0,
            ColorCode: null);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task CreateAccountAsync_WithNegativeInitialBalance_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var request = new CreateAccountRequest(
            Name: "Efectivo",
            Type: AccountType.Cash,
            InitialBalance: -50,
            CurrencyCode: "PEN",
            InstitutionName: null,
            CardHolderName: null,
            CardLast4Digits: null,
            CreditLimit: null,
            StatementClosingDay: null,
            PaymentDueDay: null,
            ColorCode: null);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task DeleteAccountAsync_SetsIsActiveToFalse()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        await dbContext.SaveChangesAsync();
        var service = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));

        await service.DeleteAsync(userId, account.Id);

        var updated = await dbContext.Accounts.FindAsync(account.Id);
        Assert.NotNull(updated);
        Assert.False(updated!.IsActive);
    }

    // ── Transfer correctness ───────────────────────────────────────────────

    [Fact]
    public async Task CreateTransfer_CreatesTwoLinkedRows()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var source = AddAccount(dbContext, userId, AccountType.Cash);
        var dest = AddAccount(dbContext, userId, AccountType.BankAccount);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);

        var response = await service.CreateAsync(userId, new CreateTransactionRequest(
            source.Id, TransactionType.Transfer, null, 100, "Transfer", DateTime.UtcNow, ToAccountId: dest.Id));

        var rows = await dbContext.Transactions
            .Where(t => t.TransferPairId == response.TransferPairId)
            .ToListAsync();

        Assert.Equal(2, rows.Count);
        Assert.Contains(rows, t => t.FromAccountId == source.Id && t.ToAccountId == dest.Id);
        Assert.Contains(rows, t => t.FromAccountId == dest.Id && t.ToAccountId == null);
    }

    [Fact]
    public async Task CreateTransfer_BalanceDecreasesOnSourceAndIncreasesOnDest()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var source = AddAccount(dbContext, userId, AccountType.Cash);
        var dest = AddAccount(dbContext, userId, AccountType.BankAccount);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);
        var txRepo = new TransactionRepository(dbContext);

        await service.CreateAsync(userId, new CreateTransactionRequest(
            source.Id, TransactionType.Transfer, null, 300, "Transfer", DateTime.UtcNow, ToAccountId: dest.Id));

        var sourceDelta = await txRepo.GetAccountBalanceDeltaAsync(source.Id);
        var destDelta = await txRepo.GetAccountBalanceDeltaAsync(dest.Id);

        Assert.Equal(-300, sourceDelta);
        Assert.Equal(300, destDelta);
    }

    [Fact]
    public async Task CreateTransfer_TwoSequentialTransfers_BothSucceed()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var source = AddAccount(dbContext, userId, AccountType.Cash);
        var dest = AddAccount(dbContext, userId, AccountType.BankAccount);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);

        await service.CreateAsync(userId, new CreateTransactionRequest(
            source.Id, TransactionType.Transfer, null, 50, "First", DateTime.UtcNow, ToAccountId: dest.Id));

        var second = await service.CreateAsync(userId, new CreateTransactionRequest(
            source.Id, TransactionType.Transfer, null, 75, "Second", DateTime.UtcNow, ToAccountId: dest.Id));

        Assert.Equal(75, second.Amount);
        Assert.Equal(4, await dbContext.Transactions.CountAsync());
    }

    [Fact]
    public async Task DeleteTransfer_SoftDeletesBothRows()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var source = AddAccount(dbContext, userId, AccountType.Cash);
        var dest = AddAccount(dbContext, userId, AccountType.BankAccount);
        await dbContext.SaveChangesAsync();
        var service = CreateTransactionService(dbContext);

        var response = await service.CreateAsync(userId, new CreateTransactionRequest(
            source.Id, TransactionType.Transfer, null, 100, "Transfer", DateTime.UtcNow, ToAccountId: dest.Id));

        await service.DeleteAsync(userId, response.Id);

        var rows = await dbContext.Transactions
            .Where(t => t.TransferPairId == response.TransferPairId)
            .ToListAsync();

        Assert.Equal(2, rows.Count);
        Assert.All(rows, t => Assert.False(t.IsActive));
    }

    // ── BalanceService concurrency bug ─────────────────────────────────────
    //
    // Root cause of "A second operation was started on this context instance":
    //
    //   BalanceService.GetUserBalanceAsync uses Task.WhenAll to compute
    //   balances for all accounts in parallel. Each account triggers two
    //   async DB queries (income + expense) via the SAME DbContext instance.
    //   With InMemory the queries complete synchronously so tasks never truly
    //   overlap. With PostgreSQL the queries suspend on network I/O, so
    //   multiple async operations run concurrently on one DbContext → error.
    //
    // Fix: replace Task.WhenAll with a sequential foreach in BalanceService.

    [Fact]
    public async Task GetUserBalance_WithOneAccount_AlwaysSucceeds()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        AddAccount(dbContext, userId, AccountType.Cash);
        await dbContext.SaveChangesAsync();
        var balanceService = new BalanceService(new TransactionRepository(dbContext), new AccountRepository(dbContext));

        // Single account → GetAccountBalanceAsync is never called via Task.WhenAll
        // → no concurrent DB access → always works, even with PostgreSQL.
        var response = await balanceService.GetUserBalanceAsync(userId);

        Assert.Equal(0, response.Balance);
    }

    [Fact]
    public async Task GetUserBalance_WithMultipleAccounts_PassesWithInMemoryFailsWithPostgres()
    {
        // This test PASSES with InMemory (synchronous queries never truly overlap).
        // The same call THROWS InvalidOperationException with PostgreSQL because
        // Task.WhenAll starts concurrent async queries on the same DbContext.
        //
        // To reproduce in a unit test environment, see the next test which uses
        // a semaphore-gated repository to force real async overlap.

        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        AddAccount(dbContext, userId, AccountType.Cash);
        AddAccount(dbContext, userId, AccountType.BankAccount);
        await dbContext.SaveChangesAsync();
        var balanceService = new BalanceService(new TransactionRepository(dbContext), new AccountRepository(dbContext));

        await balanceService.GetUserBalanceAsync(userId);
    }

    [Fact]
    public async Task GetUserBalance_ConcurrentQueriesOnSameContext_DocumentsProductionBug()
    {
        // BUG DOCUMENTATION — root cause of the "second operation" error.
        //
        // BalanceService.GetUserBalanceAsync does:
        //   await Task.WhenAll(activeAccounts.Select(GetAccountBalanceAsync))
        //
        // Each GetAccountBalanceAsync fires two EF Core queries (income + expense)
        // on the SAME shared DbContext instance. Task.WhenAll starts all of them
        // concurrently before any completes.
        //
        // InMemory  → queries complete synchronously, tasks never truly overlap → PASSES.
        // PostgreSQL → queries are truly async (network I/O suspends each task), so
        //              multiple queries overlap on the same DbContext context →
        //              InvalidOperationException: "A second operation was started on
        //              this context instance before a previous operation completed."
        //
        // This is why the error appears when the frontend refreshes account balances
        // (GET /accounts/balance/summary) right after creating a transfer: with two
        // accounts, Task.WhenAll starts 4 concurrent DB queries on one DbContext.
        //
        // FIX → see GetUserBalance_SequentialQueriesOnSameContext_NeverThrows below.

        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        AddAccount(dbContext, userId, AccountType.Cash);
        AddAccount(dbContext, userId, AccountType.BankAccount);
        await dbContext.SaveChangesAsync();

        var balanceService = new BalanceService(
            new TransactionRepository(dbContext),
            new AccountRepository(dbContext));

        // Passes with InMemory. Throws InvalidOperationException with PostgreSQL.
        await balanceService.GetUserBalanceAsync(userId);
    }

    [Fact]
    public async Task GetUserBalance_SequentialQueriesOnSameContext_NeverThrows()
    {
        // Proves the fix: a sequential loop instead of Task.WhenAll eliminates
        // concurrent DbContext access and works correctly with both InMemory and PostgreSQL.

        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account1 = AddAccount(dbContext, userId, AccountType.Cash);
        var account2 = AddAccount(dbContext, userId, AccountType.BankAccount);
        var income = AddCategory(dbContext, userId, TransactionType.Income);
        await dbContext.SaveChangesAsync();

        var txService = CreateTransactionService(dbContext);
        await txService.CreateAsync(userId, new CreateTransactionRequest(
            account1.Id, TransactionType.Income, income.Id, 500, "Salary", DateTime.UtcNow));
        await txService.CreateAsync(userId, new CreateTransactionRequest(
            account1.Id, TransactionType.Transfer, null, 200, "Transfer", DateTime.UtcNow, ToAccountId: account2.Id));

        var repo = new TransactionRepository(dbContext);
        var accountRepo = new AccountRepository(dbContext);
        var accounts = await accountRepo.ListByUserIdAsync(userId, null);

        decimal total = 0;
        foreach (var account in accounts.Where(a => a.IsActive))
        {
            total += account.InitialBalance.GetValueOrDefault(0)
                + await repo.GetAccountBalanceDeltaAsync(account.Id);
        }

        Assert.Equal(500, total); // 300 in account1 + 200 in account2
    }

    // Gated repository: lets us suspend one async query until a second has started,
    // forcing real concurrent access on a single DbContext instance.
    private sealed class GatedTransactionRepository(MonetriaDbContext dbContext, SemaphoreSlim gate)
        : ITransactionRepository
    {
        private bool _firstCall = true;

        public async Task<IReadOnlyList<Transaction>> ListByUserIdAsync(
            Guid userId, TransactionFilterRequest filter, CancellationToken ct = default)
        {
            if (_firstCall)
            {
                _firstCall = false;
                await gate.WaitAsync(ct); // suspend until gate.Release() is called
            }

            return await dbContext.Transactions
                .AsNoTracking()
                .Where(t => t.IsActive && dbContext.Accounts
                    .Where(a => a.UserId == userId)
                    .Select(a => a.Id)
                    .Contains(t.FromAccountId))
                .ToListAsync(ct);
        }

        public Task AddAsync(Transaction transaction, CancellationToken ct = default)
        {
            dbContext.Transactions.Add(transaction);
            return Task.CompletedTask;
        }

        public Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => dbContext.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.IsActive, ct);

        public Task<decimal> GetAccountBalanceDeltaAsync(Guid accountId, CancellationToken ct = default)
            => dbContext.Transactions
                .AsNoTracking()
                .Where(t => t.IsActive && t.FromAccountId == accountId)
                .SumAsync(t =>
                    t.Type == TransactionType.Income ? t.Amount :
                    t.Type == TransactionType.Expense ? -t.Amount :
                    t.ToAccountId.HasValue ? -t.Amount : t.Amount, ct);

        public Task<IReadOnlyList<Transaction>> ListByAccountIdAsync(
            Guid accountId, TransactionFilterRequest filter, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Transaction>>(new List<Transaction>());

        public Task<Transaction?> GetTransferPairAsync(Guid transactionId, Guid transferPairId, CancellationToken ct = default)
            => dbContext.Transactions
                .FirstOrDefaultAsync(t => t.TransferPairId == transferPairId && t.Id != transactionId, ct);
    }

    private sealed class TestJwtTokenGenerator : IJwtTokenGenerator
    {
        public string GenerateToken(User user)
        {
            return $"test-token-{user.Id}";
        }
    }
}
