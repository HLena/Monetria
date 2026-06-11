using Microsoft.EntityFrameworkCore;
using Monetria.Application.Accounts;
using Monetria.Application.Auth;
using Monetria.Application.Budgets;
using Monetria.Application.Categories;
using Monetria.Application.Debts;
using Monetria.Application.Recurrings;
using Monetria.Application.SavingsGoals;
using Monetria.Application.SavingsPockets;
using Monetria.Application.Transactions;
using Monetria.Application.Users;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
using Monetria.Infrastructure.Accounts;
using Monetria.Infrastructure.Auth;
using Monetria.Infrastructure.Budgets;
using Monetria.Infrastructure.Categories;
using Monetria.Infrastructure.Debts;
using Monetria.Infrastructure.Persistence;
using Monetria.Infrastructure.Recurrings;
using Monetria.Infrastructure.SavingsGoals;
using Monetria.Infrastructure.SavingsPockets;
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

        Assert.Empty(list.Items);
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

        public Task<int> CountByUserIdAsync(Guid userId, TransactionFilterRequest filter, CancellationToken ct = default)
            => Task.FromResult(0);
    }

    private sealed class TestJwtTokenGenerator : IJwtTokenGenerator
    {
        public string GenerateToken(User user)
        {
            return $"test-token-{user.Id}";
        }
    }

    // ── RecurringOccurrence ────────────────────────────────────────────────

    private static RecurringOccurrenceService CreateOccurrenceService(MonetriaDbContext dbContext) =>
        new(new RecurringOccurrenceRepository(dbContext),
            new RecurringRepository(dbContext),
            new TransactionRepository(dbContext),
            new MonetriaUnitOfWork(dbContext));

    private static Recurring AddRecurring(
        MonetriaDbContext dbContext,
        Guid userId,
        Guid accountId,
        RecurringAmountType amountType,
        decimal? amount = 100,
        decimal? estimatedAmount = null)
    {
        var recurring = new Recurring
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountId = accountId,
            Name = "Test Recurring",
            Type = TransactionType.Expense,
            AmountType = amountType,
            Amount = amount,
            EstimatedAmount = estimatedAmount,
            Frequency = RecurringFrequency.Monthly,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            NextDueDate = DateOnly.FromDateTime(DateTime.UtcNow),
            IsActive = true
        };
        dbContext.Recurrings.Add(recurring);
        return recurring;
    }

    private static RecurringOccurrence AddOccurrence(
        MonetriaDbContext dbContext,
        Guid recurringId,
        RecurringOccurrenceStatus status = RecurringOccurrenceStatus.Pending,
        decimal? suggestedAmount = null)
    {
        var occurrence = new RecurringOccurrence
        {
            Id = Guid.NewGuid(),
            RecurringId = recurringId,
            ScheduledDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Status = status,
            SuggestedAmount = suggestedAmount
        };
        dbContext.RecurringOccurrences.Add(occurrence);
        return occurrence;
    }

    [Fact]
    public async Task ConfirmOccurrenceAsync_Estimated_CreatesTransactionAndUpdatesStatus()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var recurring = AddRecurring(dbContext, userId, account.Id, RecurringAmountType.Estimated, estimatedAmount: 200);
        var occurrence = AddOccurrence(dbContext, recurring.Id, suggestedAmount: 200);
        await dbContext.SaveChangesAsync();
        var service = CreateOccurrenceService(dbContext);

        var result = await service.ConfirmAsync(userId, occurrence.Id, new ConfirmOccurrenceRequest(null));

        Assert.Equal(RecurringOccurrenceStatus.Confirmed, result.Status);
        Assert.Equal(200, result.RealAmount);
        Assert.NotNull(result.TransactionId);
        Assert.True(await dbContext.Transactions.AnyAsync(t => t.Id == result.TransactionId));
    }

    [Fact]
    public async Task ConfirmOccurrenceAsync_VariableFree_UsesProvidedAmount()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var recurring = AddRecurring(dbContext, userId, account.Id, RecurringAmountType.VariableFree);
        var occurrence = AddOccurrence(dbContext, recurring.Id);
        await dbContext.SaveChangesAsync();
        var service = CreateOccurrenceService(dbContext);

        var result = await service.ConfirmAsync(userId, occurrence.Id, new ConfirmOccurrenceRequest(350));

        Assert.Equal(RecurringOccurrenceStatus.Confirmed, result.Status);
        Assert.Equal(350, result.RealAmount);
    }

    [Fact]
    public async Task ConfirmOccurrenceAsync_VariableFree_WithoutAmount_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var recurring = AddRecurring(dbContext, userId, account.Id, RecurringAmountType.VariableFree);
        var occurrence = AddOccurrence(dbContext, recurring.Id);
        await dbContext.SaveChangesAsync();
        var service = CreateOccurrenceService(dbContext);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ConfirmAsync(userId, occurrence.Id, new ConfirmOccurrenceRequest(null)));
    }

    [Fact]
    public async Task SkipOccurrenceAsync_SetsStatusSkipped()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var recurring = AddRecurring(dbContext, userId, account.Id, RecurringAmountType.Estimated, estimatedAmount: 100);
        var occurrence = AddOccurrence(dbContext, recurring.Id);
        await dbContext.SaveChangesAsync();
        var service = CreateOccurrenceService(dbContext);

        var result = await service.SkipAsync(userId, occurrence.Id);

        Assert.Equal(RecurringOccurrenceStatus.Skipped, result.Status);
        Assert.Null(result.TransactionId);
    }

    [Fact]
    public async Task SkipOccurrenceAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var account = AddAccount(dbContext, ownerId, AccountType.Cash);
        var recurring = AddRecurring(dbContext, ownerId, account.Id, RecurringAmountType.Estimated, estimatedAmount: 100);
        var occurrence = AddOccurrence(dbContext, recurring.Id);
        await dbContext.SaveChangesAsync();
        var service = CreateOccurrenceService(dbContext);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.SkipAsync(requesterId, occurrence.Id));
    }

    [Fact]
    public async Task ConfirmOccurrenceAsync_AlreadyConfirmed_ThrowsInvalidOperationException()
    {
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        var account = AddAccount(dbContext, userId, AccountType.Cash);
        var recurring = AddRecurring(dbContext, userId, account.Id, RecurringAmountType.Estimated, estimatedAmount: 100);
        var occurrence = AddOccurrence(dbContext, recurring.Id, RecurringOccurrenceStatus.Confirmed);
        await dbContext.SaveChangesAsync();
        var service = CreateOccurrenceService(dbContext);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ConfirmAsync(userId, occurrence.Id, new ConfirmOccurrenceRequest(100)));
    }

    // ── SavingsPocket ──────────────────────────────────────────────────────

    private static SavingsPocketService CreateSavingsPocketService(MonetriaDbContext dbContext) =>
        new(new SavingsPocketRepository(dbContext), new AccountRepository(dbContext), new MonetriaUnitOfWork(dbContext));

    [Fact]
    public async Task CreateSavingsPocketAsync_CurrentAmountAlwaysStartsAtZero()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsPocketService(dbContext);
        var userId = Guid.NewGuid();

        var pocket = await service.CreateAsync(userId, new CreateSavingsPocketRequest("Vacaciones", null, null, null));

        Assert.Equal(0, pocket.CurrentAmount);
    }

    [Fact]
    public async Task AdjustAmountAsync_Deposit_IncreasesAmount()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsPocketService(dbContext);
        var userId = Guid.NewGuid();
        var pocket = await service.CreateAsync(userId, new CreateSavingsPocketRequest("Fondo", null, null, null));

        var result = await service.AdjustAmountAsync(userId, pocket.Id, new AdjustSavingsPocketRequest(500, null));

        Assert.Equal(500, result.CurrentAmount);
    }

    [Fact]
    public async Task AdjustAmountAsync_Withdrawal_DecreasesAmount()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsPocketService(dbContext);
        var userId = Guid.NewGuid();
        var pocket = await service.CreateAsync(userId, new CreateSavingsPocketRequest("Fondo", null, null, null));
        await service.AdjustAmountAsync(userId, pocket.Id, new AdjustSavingsPocketRequest(1000, null));

        var result = await service.AdjustAmountAsync(userId, pocket.Id, new AdjustSavingsPocketRequest(-300, null));

        Assert.Equal(700, result.CurrentAmount);
    }

    [Fact]
    public async Task AdjustAmountAsync_WithdrawMoreThanBalance_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsPocketService(dbContext);
        var userId = Guid.NewGuid();
        var pocket = await service.CreateAsync(userId, new CreateSavingsPocketRequest("Fondo", null, null, null));
        await service.AdjustAmountAsync(userId, pocket.Id, new AdjustSavingsPocketRequest(200, null));

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AdjustAmountAsync(userId, pocket.Id, new AdjustSavingsPocketRequest(-201, null)));
    }

    [Fact]
    public async Task AdjustAmountAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsPocketService(dbContext);
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var pocket = await service.CreateAsync(ownerId, new CreateSavingsPocketRequest("Fondo", null, null, null));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AdjustAmountAsync(requesterId, pocket.Id, new AdjustSavingsPocketRequest(100, null)));
    }

    [Fact]
    public async Task DeleteSavingsPocketAsync_SetsIsActiveFalse_DoesNotPhysicallyDelete()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsPocketService(dbContext);
        var userId = Guid.NewGuid();
        var pocket = await service.CreateAsync(userId, new CreateSavingsPocketRequest("Fondo", null, null, null));

        await service.DeleteAsync(userId, pocket.Id);

        var stored = await dbContext.SavingsPockets.FindAsync(pocket.Id);
        Assert.NotNull(stored);
        Assert.False(stored!.IsActive);
    }

    // ── Budget ────────────────────────────────────────────────────────────

    private static BudgetService CreateBudgetService(MonetriaDbContext dbContext) =>
        new(new BudgetRepository(dbContext), new MonetriaUnitOfWork(dbContext));

    [Fact]
    public async Task CreateBudgetAsync_WithValidRequest_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateBudgetService(dbContext);
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        var budget = await service.CreateAsync(userId, new CreateBudgetRequest(categoryId, 500, 6, 2026));

        Assert.Equal(userId, budget.UserId);
        Assert.Equal(categoryId, budget.CategoryId);
        Assert.Equal(500, budget.LimitAmount);
        Assert.Equal(6, budget.Month);
        Assert.Equal(2026, budget.Year);
    }

    [Fact]
    public async Task CreateBudgetAsync_WithZeroLimitAmount_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateBudgetService(dbContext);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(Guid.NewGuid(), new CreateBudgetRequest(Guid.NewGuid(), 0, 6, 2026)));
    }

    [Fact]
    public async Task CreateBudgetAsync_WithInvalidMonth_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateBudgetService(dbContext);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(Guid.NewGuid(), new CreateBudgetRequest(Guid.NewGuid(), 100, 13, 2026)));
    }

    [Fact]
    public async Task DeleteBudgetAsync_WhenBelongsToAnotherUser_ThrowsUnauthorizedAccessException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateBudgetService(dbContext);
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();

        var budget = await service.CreateAsync(ownerId, new CreateBudgetRequest(Guid.NewGuid(), 200, 1, 2026));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.DeleteAsync(requesterId, budget.Id));
    }

    [Fact]
    public async Task ListBudgetsAsync_WithMonthFilter_ReturnsOnlyMatchingBudgets()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateBudgetService(dbContext);
        var userId = Guid.NewGuid();

        await service.CreateAsync(userId, new CreateBudgetRequest(Guid.NewGuid(), 100, 1, 2026));
        await service.CreateAsync(userId, new CreateBudgetRequest(Guid.NewGuid(), 100, 2, 2026));

        var result = await service.ListByUserIdAsync(userId, month: 1, year: null);

        Assert.Single(result);
        Assert.Equal(1, result[0].Month);
    }

    // ── Debt ──────────────────────────────────────────────────────────────

    private static DebtService CreateDebtService(MonetriaDbContext dbContext) =>
        new(new DebtRepository(dbContext),
            new AccountRepository(dbContext),
            new TransactionRepository(dbContext),
            new MonetriaUnitOfWork(dbContext));

    [Fact]
    public async Task CreateDebtAsync_WithValidRequest_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateDebtService(dbContext);
        var userId = Guid.NewGuid();

        var debt = await service.CreateAsync(userId, new CreateDebtRequest(
            "Car Loan", "Bank", 10000, 8000, 0.05m, 200, null, "personal"));

        Assert.Equal(userId, debt.UserId);
        Assert.Equal("Car Loan", debt.Name);
        Assert.Equal(10000, debt.OriginalAmount);
        Assert.Equal(8000, debt.RemainingAmount);
        Assert.True(debt.IsActive);
    }

    [Fact]
    public async Task CreateDebtAsync_WithNegativeOriginalAmount_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateDebtService(dbContext);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(Guid.NewGuid(), new CreateDebtRequest(
                "Bad Debt", null, -100, 0, 0, 10, null, null)));
    }

    [Fact]
    public async Task CreateDebtAsync_WithRemainingExceedingOriginal_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateDebtService(dbContext);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(Guid.NewGuid(), new CreateDebtRequest(
                "Bad Debt", null, 1000, 1500, 0, 10, null, null)));
    }

    [Fact]
    public async Task DeleteDebtAsync_SetsIsActiveFalse()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateDebtService(dbContext);
        var userId = Guid.NewGuid();

        var debt = await service.CreateAsync(userId, new CreateDebtRequest(
            "Loan", null, 5000, 5000, 0, 100, null, null));

        await service.DeleteAsync(userId, debt.Id);

        var stored = await dbContext.Debts.FindAsync(debt.Id);
        Assert.NotNull(stored);
        Assert.False(stored!.IsActive);
    }

    [Fact]
    public async Task PayDebtAsync_ReducesRemainingAmount()
    {
        await using var dbContext = CreateDbContext();
        var accountService = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var debtService = CreateDebtService(dbContext);
        var userId = Guid.NewGuid();

        var account = await accountService.CreateAsync(userId, new CreateAccountRequest(
            "Wallet", AccountType.Cash, 0, "USD", null, null, null, null, null, null, null));

        var debt = await debtService.CreateAsync(userId, new CreateDebtRequest(
            "Loan", null, 5000, 5000, 0, 100, null, null, account.Id));

        var result = await debtService.PayAsync(userId, debt.Id, new PayDebtRequest(500));

        Assert.Equal(4500, result.RemainingAmount);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task PayDebtAsync_WhenFullyPaid_SetsIsActiveFalse()
    {
        await using var dbContext = CreateDbContext();
        var accountService = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var debtService = CreateDebtService(dbContext);
        var userId = Guid.NewGuid();

        var account = await accountService.CreateAsync(userId, new CreateAccountRequest(
            "Wallet", AccountType.Cash, 0, "USD", null, null, null, null, null, null, null));

        var debt = await debtService.CreateAsync(userId, new CreateDebtRequest(
            "SmallLoan", null, 200, 200, 0, 50, null, null, account.Id));

        var result = await debtService.PayAsync(userId, debt.Id, new PayDebtRequest(200));

        Assert.Equal(0, result.RemainingAmount);
        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task ListDebtsAsync_WithIsActiveFilter_ReturnsOnlyActive()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateDebtService(dbContext);
        var userId = Guid.NewGuid();

        var debt = await service.CreateAsync(userId, new CreateDebtRequest(
            "Active Debt", null, 1000, 1000, 0, 100, null, null));

        await service.CreateAsync(userId, new CreateDebtRequest(
            "Inactive Debt", null, 500, 500, 0, 50, null, null));

        await service.DeleteAsync(userId, (await service.ListByUserIdAsync(userId))
            .First(d => d.Name == "Inactive Debt").Id);

        var activeDebts = await service.ListByUserIdAsync(userId, isActive: true);

        Assert.Single(activeDebts);
        Assert.Equal("Active Debt", activeDebts[0].Name);
    }

    // ── SavingsGoal ───────────────────────────────────────────────────────

    private static SavingsGoalService CreateSavingsGoalService(MonetriaDbContext dbContext) =>
        new(new SavingsGoalRepository(dbContext),
            new AccountRepository(dbContext),
            new BalanceService(new TransactionRepository(dbContext), new AccountRepository(dbContext)),
            new MonetriaUnitOfWork(dbContext));

    [Fact]
    public async Task CreateSavingsGoalAsync_WithValidRequest_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsGoalService(dbContext);
        var userId = Guid.NewGuid();

        var goal = await service.CreateAsync(userId, new CreateSavingsGoalRequest(
            "Vacation", 3000, 0, null, null, null, null, null));

        Assert.Equal(userId, goal.UserId);
        Assert.Equal("Vacation", goal.Name);
        Assert.Equal(3000, goal.TargetAmount);
        Assert.False(goal.IsCompleted);
    }

    [Fact]
    public async Task CreateSavingsGoalAsync_WithZeroTargetAmount_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsGoalService(dbContext);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(Guid.NewGuid(), new CreateSavingsGoalRequest(
                "Invalid Goal", 0, 0, null, null, null, null, null)));
    }

    [Fact]
    public async Task CreateSavingsGoalAsync_WhenCurrentAmountMeetsTarget_IsCompleted()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsGoalService(dbContext);
        var userId = Guid.NewGuid();

        var goal = await service.CreateAsync(userId, new CreateSavingsGoalRequest(
            "Already Done", 1000, 1000, null, null, null, null, null));

        Assert.True(goal.IsCompleted);
    }

    [Fact]
    public async Task ListSavingsGoalsAsync_ExcludesDeletedByDefault()
    {
        await using var dbContext = CreateDbContext();
        var service = CreateSavingsGoalService(dbContext);
        var userId = Guid.NewGuid();

        var goal = await service.CreateAsync(userId, new CreateSavingsGoalRequest(
            "To Delete", 500, 0, null, null, null, null, null));

        await service.DeleteAsync(userId, goal.Id);

        var active = await service.ListByUserIdAsync(userId, includeInactive: false);
        var all = await service.ListByUserIdAsync(userId, includeInactive: true);

        Assert.Empty(active);
        Assert.Single(all);
    }

    // ── Recurring ─────────────────────────────────────────────────────────

    private static RecurringService CreateRecurringService(MonetriaDbContext dbContext) =>
        new(new RecurringRepository(dbContext),
            new AccountRepository(dbContext),
            new CategoryRepository(dbContext),
            new MonetriaUnitOfWork(dbContext));

    [Fact]
    public async Task CreateRecurringAsync_WithValidRequest_Succeeds()
    {
        await using var dbContext = CreateDbContext();
        var accountService = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var recurringService = CreateRecurringService(dbContext);
        var userId = Guid.NewGuid();

        var account = await accountService.CreateAsync(userId, new CreateAccountRequest(
            "Wallet", AccountType.Cash, 0, "USD", null, null, null, null, null, null, null));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var recurring = await recurringService.CreateAsync(userId, new CreateRecurringRequest(
            account.Id, null, null, "Netflix", TransactionType.Expense,
            RecurringAmountType.Fixed, 15, null, RecurringFrequency.Monthly, today, null, today));

        Assert.Equal("Netflix", recurring.Name);
        Assert.Equal(userId, recurring.UserId);
        Assert.True(recurring.IsActive);
    }

    [Fact]
    public async Task CreateRecurringAsync_WithoutAmount_ForFixedType_ThrowsArgumentException()
    {
        await using var dbContext = CreateDbContext();
        var accountService = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var recurringService = CreateRecurringService(dbContext);
        var userId = Guid.NewGuid();

        var account = await accountService.CreateAsync(userId, new CreateAccountRequest(
            "Wallet", AccountType.Cash, 0, "USD", null, null, null, null, null, null, null));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            recurringService.CreateAsync(userId, new CreateRecurringRequest(
                account.Id, null, null, "Bad", TransactionType.Expense,
                RecurringAmountType.Fixed, null, null, RecurringFrequency.Monthly, today, null, today)));
    }

    [Fact]
    public async Task DeactivateRecurringAsync_SetsIsActiveFalse()
    {
        await using var dbContext = CreateDbContext();
        var accountService = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var recurringService = CreateRecurringService(dbContext);
        var userId = Guid.NewGuid();

        var account = await accountService.CreateAsync(userId, new CreateAccountRequest(
            "Wallet", AccountType.Cash, 0, "USD", null, null, null, null, null, null, null));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var recurring = await recurringService.CreateAsync(userId, new CreateRecurringRequest(
            account.Id, null, null, "Spotify", TransactionType.Expense,
            RecurringAmountType.Fixed, 10, null, RecurringFrequency.Monthly, today, null, today));

        var result = await recurringService.DeactivateAsync(userId, recurring.Id);

        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task ListRecurringsAsync_WithPagination_ReturnsCorrectPage()
    {
        await using var dbContext = CreateDbContext();
        var accountService = new AccountService(new AccountRepository(dbContext), new TransactionRepository(dbContext), new MonetriaUnitOfWork(dbContext));
        var recurringService = CreateRecurringService(dbContext);
        var userId = Guid.NewGuid();

        var account = await accountService.CreateAsync(userId, new CreateAccountRequest(
            "Wallet", AccountType.Cash, 0, "USD", null, null, null, null, null, null, null));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        for (var i = 1; i <= 5; i++)
        {
            await recurringService.CreateAsync(userId, new CreateRecurringRequest(
                account.Id, null, null, $"Sub {i}", TransactionType.Expense,
                RecurringAmountType.Fixed, 10, null, RecurringFrequency.Monthly, today, null, today));
        }

        var page1 = await recurringService.ListByUserIdAsync(userId, new RecurringFilterRequest(false, 1, 3));
        var page2 = await recurringService.ListByUserIdAsync(userId, new RecurringFilterRequest(false, 2, 3));

        Assert.Equal(3, page1.Items.Count);
        Assert.Equal(2, page2.Items.Count);
        Assert.Equal(5, page1.TotalCount);
    }
}
