namespace Monetria.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardResponse> GetDashboardAsync(Guid userId, CancellationToken cancellationToken = default);
}
