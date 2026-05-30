using System.Security.Claims;
using Monetria.Application.FixedExpenses;

namespace Monetria.API.Endpoints;

public static class FixedExpenseEndpoints
{
    public static IEndpointRouteBuilder MapFixedExpenseEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/fixed-expenses")
            .WithTags("Fixed Expenses")
            .RequireAuthorization();

        group.MapPost("/", CreateFixedExpenseAsync).WithName("CreateFixedExpense");
        group.MapGet("/", ListFixedExpensesAsync).WithName("ListFixedExpenses");
        group.MapPut("/{fixedExpenseId:guid}", UpdateFixedExpenseAsync).WithName("UpdateFixedExpense");
        group.MapPatch("/{fixedExpenseId:guid}/deactivate", DeactivateFixedExpenseAsync).WithName("DeactivateFixedExpense");

        return endpoints;
    }

    private static async Task<IResult> CreateFixedExpenseAsync(
        CreateFixedExpenseRequest request,
        ClaimsPrincipal user,
        IFixedExpenseService fixedExpenseService,
        CancellationToken cancellationToken)
    {
        var fixedExpense = await fixedExpenseService.CreateAsync(user.GetRequiredUserId(), request, cancellationToken);
        return Results.Created($"/fixed-expenses/{fixedExpense.Id}", fixedExpense);
    }

    private static async Task<IResult> ListFixedExpensesAsync(
        bool includeInactive,
        ClaimsPrincipal user,
        IFixedExpenseService fixedExpenseService,
        CancellationToken cancellationToken)
    {
        var fixedExpenses = await fixedExpenseService.ListByUserIdAsync(
            user.GetRequiredUserId(),
            includeInactive,
            cancellationToken);

        return Results.Ok(fixedExpenses);
    }

    private static async Task<IResult> UpdateFixedExpenseAsync(
        Guid fixedExpenseId,
        UpdateFixedExpenseRequest request,
        ClaimsPrincipal user,
        IFixedExpenseService fixedExpenseService,
        CancellationToken cancellationToken)
    {
        var fixedExpense = await fixedExpenseService.UpdateAsync(
            user.GetRequiredUserId(),
            fixedExpenseId,
            request,
            cancellationToken);

        return Results.Ok(fixedExpense);
    }

    private static async Task<IResult> DeactivateFixedExpenseAsync(
        Guid fixedExpenseId,
        ClaimsPrincipal user,
        IFixedExpenseService fixedExpenseService,
        CancellationToken cancellationToken)
    {
        var fixedExpense = await fixedExpenseService.DeactivateAsync(
            user.GetRequiredUserId(),
            fixedExpenseId,
            cancellationToken);

        return Results.Ok(fixedExpense);
    }
}
