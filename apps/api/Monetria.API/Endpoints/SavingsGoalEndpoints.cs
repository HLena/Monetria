using System.Security.Claims;
using Monetria.Application.SavingsGoals;

namespace Monetria.API.Endpoints;

public static class SavingsGoalEndpoints
{
    public static IEndpointRouteBuilder MapSavingsGoalEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/savings-goals")
            .WithTags("Savings Goals")
            .RequireAuthorization();

        group.MapPost("/", CreateSavingsGoalAsync).WithName("CreateSavingsGoal");
        group.MapGet("/", ListSavingsGoalsAsync).WithName("ListSavingsGoals");
        group.MapPut("/{savingsGoalId:guid}", UpdateSavingsGoalAsync).WithName("UpdateSavingsGoal");
        group.MapDelete("/{savingsGoalId:guid}", DeleteSavingsGoalAsync).WithName("DeleteSavingsGoal");

        return endpoints;
    }

    private static async Task<IResult> CreateSavingsGoalAsync(
        CreateSavingsGoalRequest request,
        ClaimsPrincipal user,
        ISavingsGoalService savingsGoalService,
        CancellationToken cancellationToken)
    {
        var savingsGoal = await savingsGoalService.CreateAsync(user.GetRequiredUserId(), request, cancellationToken);
        return Results.Created($"/savings-goals/{savingsGoal.Id}", savingsGoal);
    }

    private static async Task<IResult> ListSavingsGoalsAsync(
        bool includeInactive,
        ClaimsPrincipal user,
        ISavingsGoalService savingsGoalService,
        CancellationToken cancellationToken)
    {
        var savingsGoals = await savingsGoalService.ListByUserIdAsync(user.GetRequiredUserId(), includeInactive, cancellationToken);
        return Results.Ok(savingsGoals);
    }

    private static async Task<IResult> UpdateSavingsGoalAsync(
        Guid savingsGoalId,
        UpdateSavingsGoalRequest request,
        ClaimsPrincipal user,
        ISavingsGoalService savingsGoalService,
        CancellationToken cancellationToken)
    {
        var savingsGoal = await savingsGoalService.UpdateAsync(
            user.GetRequiredUserId(),
            savingsGoalId,
            request,
            cancellationToken);

        return Results.Ok(savingsGoal);
    }

    private static async Task<IResult> DeleteSavingsGoalAsync(
        Guid savingsGoalId,
        ClaimsPrincipal user,
        ISavingsGoalService savingsGoalService,
        CancellationToken cancellationToken)
    {
        await savingsGoalService.DeleteAsync(user.GetRequiredUserId(), savingsGoalId, cancellationToken);
        return Results.NoContent();
    }
}
