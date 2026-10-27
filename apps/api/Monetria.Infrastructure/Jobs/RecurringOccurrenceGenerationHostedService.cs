using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Monetria.Application.Recurrings;

namespace Monetria.Infrastructure.Jobs;

public sealed class RecurringOccurrenceGenerationHostedService(IServiceScopeFactory scopeFactory) : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = scopeFactory.CreateScope();
            var generationService = scope.ServiceProvider.GetRequiredService<IRecurringOccurrenceGenerationService>();
            await generationService.GenerateDueOccurrencesAsync(stoppingToken);

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }
}
