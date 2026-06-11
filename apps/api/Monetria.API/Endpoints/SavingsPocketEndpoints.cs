using System.Security.Claims;
using Monetria.Application.SavingsPockets;

namespace Monetria.API.Endpoints;

public static class SavingsPocketEndpoints
{
    public static IEndpointRouteBuilder MapSavingsPocketEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/savings-pockets")
            .WithTags("Savings Pockets")
            .RequireAuthorization();

        group.MapPost("/", CreateSavingsPocketAsync).WithName("CreateSavingsPocket");
        group.MapGet("/", ListSavingsPocketsAsync).WithName("ListSavingsPockets");
        group.MapPut("/{pocketId:guid}", UpdateSavingsPocketAsync).WithName("UpdateSavingsPocket");
        group.MapDelete("/{pocketId:guid}", DeleteSavingsPocketAsync).WithName("DeleteSavingsPocket");
        group.MapPost("/{pocketId:guid}/adjust", AdjustSavingsPocketAsync).WithName("AdjustSavingsPocket");

        return endpoints;
    }

    private static async Task<IResult> CreateSavingsPocketAsync(
        CreateSavingsPocketRequest request,
        ClaimsPrincipal user,
        ISavingsPocketService savingsPocketService,
        CancellationToken cancellationToken)
    {
        var pocket = await savingsPocketService.CreateAsync(user.GetRequiredUserId(), request, cancellationToken);
        return Results.Created($"/savings-pockets/{pocket.Id}", pocket);
    }

    private static async Task<IResult> ListSavingsPocketsAsync(
        ClaimsPrincipal user,
        ISavingsPocketService savingsPocketService,
        CancellationToken cancellationToken)
    {
        var pockets = await savingsPocketService.ListByUserIdAsync(user.GetRequiredUserId(), cancellationToken);
        return Results.Ok(pockets);
    }

    private static async Task<IResult> UpdateSavingsPocketAsync(
        Guid pocketId,
        UpdateSavingsPocketRequest request,
        ClaimsPrincipal user,
        ISavingsPocketService savingsPocketService,
        CancellationToken cancellationToken)
    {
        var pocket = await savingsPocketService.UpdateAsync(
            user.GetRequiredUserId(),
            pocketId,
            request,
            cancellationToken);

        return Results.Ok(pocket);
    }

    private static async Task<IResult> DeleteSavingsPocketAsync(
        Guid pocketId,
        ClaimsPrincipal user,
        ISavingsPocketService savingsPocketService,
        CancellationToken cancellationToken)
    {
        await savingsPocketService.DeleteAsync(user.GetRequiredUserId(), pocketId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> AdjustSavingsPocketAsync(
        Guid pocketId,
        AdjustSavingsPocketRequest request,
        ClaimsPrincipal user,
        ISavingsPocketService savingsPocketService,
        CancellationToken cancellationToken)
    {
        var pocket = await savingsPocketService.AdjustAmountAsync(
            user.GetRequiredUserId(),
            pocketId,
            request,
            cancellationToken);

        return Results.Ok(pocket);
    }
}
