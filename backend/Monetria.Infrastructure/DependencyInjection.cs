using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Monetria.Application.Accounts;
using Monetria.Application.Common;
using Monetria.Application.Transactions;
using Monetria.Application.Users;
using Monetria.Infrastructure.Accounts;
using Monetria.Infrastructure.Persistence;
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

        services.AddScoped<IUnitOfWork, MonetriaUnitOfWork>();
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}
