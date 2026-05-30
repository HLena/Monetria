using System.Security.Claims;
using Monetria.Application.Budgets;

namespace Monetria.API.Endpoints;

public static class BudgetEndpoints
{
    public static IEndpointRouteBuilder MapBudgetEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/budgets")
            .WithTags("Budgets")
            .RequireAuthorization();

        group.MapPost("/", CreateBudgetAsync).WithName("CreateBudget");
        group.MapGet("/", ListBudgetsAsync).WithName("ListBudgets");
        group.MapPut("/{budgetId:guid}", UpdateBudgetAsync).WithName("UpdateBudget");
        group.MapDelete("/{budgetId:guid}", DeleteBudgetAsync).WithName("DeleteBudget");

        return endpoints;
    }

    private static async Task<IResult> CreateBudgetAsync(
        CreateBudgetRequest request,
        ClaimsPrincipal user,
        IBudgetService budgetService,
        CancellationToken cancellationToken)
    {
        var budget = await budgetService.CreateAsync(user.GetRequiredUserId(), request, cancellationToken);
        return Results.Created($"/budgets/{budget.Id}", budget);
    }

    private static async Task<IResult> ListBudgetsAsync(
        ClaimsPrincipal user,
        IBudgetService budgetService,
        CancellationToken cancellationToken)
    {
        var budgets = await budgetService.ListByUserIdAsync(user.GetRequiredUserId(), cancellationToken);
        return Results.Ok(budgets);
    }

    private static async Task<IResult> UpdateBudgetAsync(
        Guid budgetId,
        UpdateBudgetRequest request,
        ClaimsPrincipal user,
        IBudgetService budgetService,
        CancellationToken cancellationToken)
    {
        var budget = await budgetService.UpdateAsync(user.GetRequiredUserId(), budgetId, request, cancellationToken);
        return Results.Ok(budget);
    }

    private static async Task<IResult> DeleteBudgetAsync(
        Guid budgetId,
        ClaimsPrincipal user,
        IBudgetService budgetService,
        CancellationToken cancellationToken)
    {
        await budgetService.DeleteAsync(user.GetRequiredUserId(), budgetId, cancellationToken);
        return Results.NoContent();
    }
}
