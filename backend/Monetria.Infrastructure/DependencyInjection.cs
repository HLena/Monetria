using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Monetria.Application.Accounts;
using Monetria.Application.Auth;
using Monetria.Application.Budgets;
using Monetria.Application.Categories;
using Monetria.Application.Common;
using Monetria.Application.Debts;
using Monetria.Application.FixedExpenses;
using Monetria.Application.SavingsGoals;
using Monetria.Application.Transactions;
using Monetria.Application.Users;
using Monetria.Infrastructure.Accounts;
using Monetria.Infrastructure.Auth;
using Monetria.Infrastructure.Budgets;
using Monetria.Infrastructure.Categories;
using Monetria.Infrastructure.Debts;
using Monetria.Infrastructure.FixedExpenses;
using Monetria.Infrastructure.Persistence;
using Monetria.Infrastructure.SavingsGoals;
using Monetria.Infrastructure.Transactions;
using Monetria.Infrastructure.Users;

namespace Monetria.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required.");

        services.AddDbContext<MonetriaDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services.AddScoped<IUnitOfWork, MonetriaUnitOfWork>();
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<IBudgetRepository, BudgetRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IDebtRepository, DebtRepository>();
        services.AddScoped<IFixedExpenseRepository, FixedExpenseRepository>();
        services.AddScoped<ISavingsGoalRepository, SavingsGoalRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IBalanceService, BalanceService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IBudgetService, BudgetService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IDebtService, DebtService>();
        services.AddScoped<IFixedExpenseService, FixedExpenseService>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ISavingsGoalService, SavingsGoalService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}
