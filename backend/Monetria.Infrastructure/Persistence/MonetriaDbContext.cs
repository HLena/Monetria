using Microsoft.EntityFrameworkCore;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Infrastructure.Persistence;

public class MonetriaDbContext(DbContextOptions<MonetriaDbContext> options) : DbContext(options)
{
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Debt> Debts => Set<Debt>();
    public DbSet<FixedExpense> FixedExpenses => Set<FixedExpense>();
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUser(modelBuilder);
        ConfigureAccount(modelBuilder);
        ConfigureTransaction(modelBuilder);
        ConfigureBudget(modelBuilder);
        ConfigureCategory(modelBuilder);
        ConfigureDebt(modelBuilder);
        ConfigureFixedExpense(modelBuilder);
        ConfigureSavingsGoal(modelBuilder);
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.FirstName).HasMaxLength(80).IsRequired();
            entity.Property(user => user.LastName).HasMaxLength(80).IsRequired();
            entity.Property(user => user.Email).HasMaxLength(180).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(500).IsRequired();
            entity.HasIndex(user => user.Email).IsUnique();
        });
    }

    private static void ConfigureAccount(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(account => account.Id);
            entity.Property(account => account.Name).HasMaxLength(120);
            entity.Property(account => account.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(account => account.InitialBalance).HasPrecision(18, 2);
            entity.Property(account => account.CurrencyCode).HasMaxLength(3).IsRequired();
            entity.Property(account => account.ColorCode).HasMaxLength(20).IsRequired();
            entity.Property(account => account.IsActive).IsRequired();
            entity.Property(account => account.InstitutionName).HasMaxLength(120);
            entity.Property(account => account.CardHolderName).HasMaxLength(160);
            entity.Property(account => account.CardLast4Digits).HasMaxLength(4);
            entity.Property(account => account.CreditLimit).HasPrecision(18, 2);
            entity.Property(account => account.ProviderName).HasMaxLength(120);
            entity.Property(account => account.CreatedAt).IsRequired();
            entity.Property(account => account.UpdatedAt).IsRequired();
            entity.HasOne<User>()
                .WithMany(user => user.Accounts)
                .HasForeignKey(account => account.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureTransaction(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(transaction => transaction.Id);
            entity.Property(transaction => transaction.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(transaction => transaction.Amount).HasPrecision(18, 2);
            entity.Property(transaction => transaction.Description).HasMaxLength(500);
            entity.Property(transaction => transaction.IsActive).IsRequired();
            entity.Property(transaction => transaction.TransferAccountId);
            entity.HasOne<Account>()
                .WithMany(account => account.Transactions)
                .HasForeignKey(transaction => transaction.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(transaction => transaction.Category)
                .WithMany(category => category.Transactions)
                .HasForeignKey(transaction => transaction.CategoryId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Account>()
                .WithMany()
                .HasForeignKey(transaction => transaction.TransferAccountId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureBudget(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasKey(budget => budget.Id);
            entity.Property(budget => budget.Category).HasMaxLength(120).IsRequired();
            entity.Property(budget => budget.LimitAmount).HasPrecision(18, 2);
            entity.Property(budget => budget.Period).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(budget => budget.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCategory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(category => category.Id);
            entity.Property(category => category.UserId);
            entity.Property(category => category.Name).HasMaxLength(120).IsRequired();
            entity.Property(category => category.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(category => category.Color).HasMaxLength(20);
            entity.Property(category => category.KeyIcon).HasMaxLength(60);
            entity.Property(category => category.IsDefault).IsRequired();
            entity.Property(category => category.IsActive).IsRequired();
            entity.Property(category => category.CreatedAt).IsRequired();
            entity.Property(category => category.UpdatedAt).IsRequired();
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(category => category.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(category => new { category.UserId, category.Type, category.IsActive });
            entity.HasIndex(category => new { category.UserId, category.Type, category.Name })
                .IsUnique()
                .HasFilter("\"UserId\" IS NOT NULL");
            entity.HasIndex(category => new { category.Type, category.Name })
                .IsUnique()
                .HasFilter("\"IsDefault\" = TRUE");
            entity.HasData(DefaultCategories);
        });
    }

    private static void ConfigureDebt(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Debt>(entity =>
        {
            entity.HasKey(debt => debt.Id);
            entity.Property(debt => debt.Name).HasMaxLength(120).IsRequired();
            entity.Property(debt => debt.Creditor).HasMaxLength(160);
            entity.Property(debt => debt.OriginalAmount).HasPrecision(18, 2);
            entity.Property(debt => debt.RemainingAmount).HasPrecision(18, 2);
            entity.Property(debt => debt.InterestRate).HasPrecision(9, 4);
            entity.Property(debt => debt.MinimumPayment).HasPrecision(18, 2);
            entity.Property(debt => debt.Type).HasMaxLength(80);
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(debt => debt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureFixedExpense(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FixedExpense>(entity =>
        {
            entity.HasKey(expense => expense.Id);
            entity.Property(expense => expense.Name).HasMaxLength(120).IsRequired();
            entity.Property(expense => expense.Amount).HasPrecision(18, 2);
            entity.Property(expense => expense.Category).HasMaxLength(120).IsRequired();
            entity.Property(expense => expense.Period).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(expense => expense.Notes).HasMaxLength(500);
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(expense => expense.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Account>()
                .WithMany()
                .HasForeignKey(expense => expense.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureSavingsGoal(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.HasKey(goal => goal.Id);
            entity.Property(goal => goal.Name).HasMaxLength(120).IsRequired();
            entity.Property(goal => goal.TargetAmount).HasPrecision(18, 2);
            entity.Property(goal => goal.CurrentAmount).HasPrecision(18, 2);
            entity.Property(goal => goal.Category).HasMaxLength(120);
            entity.Property(goal => goal.Color).HasMaxLength(20);
            entity.Property(goal => goal.Description).HasMaxLength(500);
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(goal => goal.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static readonly DateTime DefaultCategoryTimestamp = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static readonly Category[] DefaultCategories =
    [
        // Expense — active
        CreateDefaultCategory("11111111-1111-1111-1111-111111111111", "Alimentación", TransactionType.Expense, "#f59e0b", "ShoppingCart"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111112", "Transporte",   TransactionType.Expense, "#3b82f6", "Car"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111114", "Salud",         TransactionType.Expense, "#10b981", "Heart"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111115", "Entretenimiento", TransactionType.Expense, "#8b5cf6", "Clapperboard"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111116", "Educación",    TransactionType.Expense, "#06b6d4", "GraduationCap"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111118", "Otros",         TransactionType.Expense, "#94a3b8", "CircleDot"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111122", "Servicios",     TransactionType.Expense, "#6366f1", "Zap"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111123", "Tecnología",    TransactionType.Expense, "#ec4899", "Laptop"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111124", "Ropa",          TransactionType.Expense, "#f97316", "Shirt"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111125", "Hogar",         TransactionType.Expense, "#84cc16", "Home"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111126", "Viajes",        TransactionType.Expense, "#14b8a6", "Plane"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111127", "Restaurantes",  TransactionType.Expense, "#ef4444", "UtensilsCrossed"),
        // Expense — deactivated (legacy, kept to preserve FK integrity)
        CreateDefaultCategory("11111111-1111-1111-1111-111111111113", "Vivienda", TransactionType.Expense, "#14b8a6", null, isActive: false),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111117", "Ahorro",   TransactionType.Expense, "#22c55e", null, isActive: false),
        // Income — active
        CreateDefaultCategory("11111111-1111-1111-1111-111111111120", "Otros",       TransactionType.Income, "#94a3b8", "CircleDot"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111128", "Salario",     TransactionType.Income, "#10b981", "Briefcase"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111129", "Freelance",   TransactionType.Income, "#6366f1", "Code2"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111130", "Inversiones", TransactionType.Income, "#f59e0b", "TrendingUp"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111131", "Ventas",      TransactionType.Income, "#3b82f6", "Store"),
        CreateDefaultCategory("11111111-1111-1111-1111-111111111132", "Bonos",       TransactionType.Income, "#8b5cf6", "Gift"),
        // Income — deactivated (legacy)
        CreateDefaultCategory("11111111-1111-1111-1111-111111111119", "Ingresos", TransactionType.Income, "#10b981", null, isActive: false),
    ];

    private static Category CreateDefaultCategory(
        string id,
        string name,
        TransactionType type,
        string color,
        string? keyIcon,
        bool isActive = true)
    {
        return new Category
        {
            Id = Guid.Parse(id),
            Name = name,
            Type = type,
            Color = color,
            KeyIcon = keyIcon,
            IsDefault = true,
            IsActive = isActive,
            CreatedAt = DefaultCategoryTimestamp,
            UpdatedAt = DefaultCategoryTimestamp
        };
    }
}
