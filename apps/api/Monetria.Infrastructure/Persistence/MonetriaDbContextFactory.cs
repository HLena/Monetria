using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Monetria.Infrastructure.Persistence;

public sealed class MonetriaDbContextFactory : IDesignTimeDbContextFactory<MonetriaDbContext>
{
    private const string DefaultConnectionString =
        "Host=localhost;Port=5432;Database=monetria_dev;Username=postgres;Password=postgres";

    public MonetriaDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? DefaultConnectionString;

        var optionsBuilder = new DbContextOptionsBuilder<MonetriaDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new MonetriaDbContext(optionsBuilder.Options);
    }
}
