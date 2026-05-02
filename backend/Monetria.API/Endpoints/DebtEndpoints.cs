using System.Security.Claims;
using Monetria.Application.Debts;

namespace Monetria.API.Endpoints;

public static class DebtEndpoints
{
    public static IEndpointRouteBuilder MapDebtEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/debts")
            .WithTags("Debts")
            .RequireAuthorization();

        group.MapPost("/", CreateDebtAsync).WithName("CreateDebt");
        group.MapGet("/", ListDebtsAsync).WithName("ListDebts");
        group.MapPut("/{debtId:guid}", UpdateDebtAsync).WithName("UpdateDebt");
        group.MapDelete("/{debtId:guid}", DeleteDebtAsync).WithName("DeleteDebt");

        return endpoints;
    }

    private static async Task<IResult> CreateDebtAsync(
        CreateDebtRequest request,
        ClaimsPrincipal user,
        IDebtService debtService,
        CancellationToken cancellationToken)
    {
        var debt = await debtService.CreateAsync(user.GetRequiredUserId(), request, cancellationToken);
        return Results.Created($"/debts/{debt.Id}", debt);
    }

    private static async Task<IResult> ListDebtsAsync(
        ClaimsPrincipal user,
        IDebtService debtService,
        CancellationToken cancellationToken)
    {
        var debts = await debtService.ListByUserIdAsync(user.GetRequiredUserId(), cancellationToken);
        return Results.Ok(debts);
    }

    private static async Task<IResult> UpdateDebtAsync(
        Guid debtId,
        UpdateDebtRequest request,
        ClaimsPrincipal user,
        IDebtService debtService,
        CancellationToken cancellationToken)
    {
        var debt = await debtService.UpdateAsync(user.GetRequiredUserId(), debtId, request, cancellationToken);
        return Results.Ok(debt);
    }

    private static async Task<IResult> DeleteDebtAsync(
        Guid debtId,
        ClaimsPrincipal user,
        IDebtService debtService,
        CancellationToken cancellationToken)
    {
        await debtService.DeleteAsync(user.GetRequiredUserId(), debtId, cancellationToken);
        return Results.NoContent();
    }
}
