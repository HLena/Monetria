using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Monetria.Application.Budgets;

namespace Monetria.Infrastructure.Jobs;

public sealed class BudgetRecurrenceHostedService(IServiceScopeFactory scopeFactory) : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (DateTime.UtcNow.Day == 1)
            {
                using var scope = scopeFactory.CreateScope();
                var budgetRecurrenceService = scope.ServiceProvider.GetRequiredService<IBudgetRecurrenceService>();
                await budgetRecurrenceService.GenerateForCurrentPeriodAsync(stoppingToken);
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }
}
