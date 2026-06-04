using System.Security.Claims;
using Monetria.Application.Dashboard;

namespace Monetria.API.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/dashboard", GetDashboardAsync)
            .WithTags("Dashboard")
            .WithName("GetDashboard")
            .RequireAuthorization();

        return endpoints;
    }

    private static async Task<IResult> GetDashboardAsync(
        ClaimsPrincipal user,
        IDashboardService dashboardService,
        CancellationToken cancellationToken)
    {
        var dashboard = await dashboardService.GetDashboardAsync(user.GetRequiredUserId(), cancellationToken);
        return Results.Ok(dashboard);
    }
}
