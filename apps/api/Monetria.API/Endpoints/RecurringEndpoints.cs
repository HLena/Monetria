using System.Security.Claims;
using Monetria.Application.Recurrings;

namespace Monetria.API.Endpoints;

public static class RecurringEndpoints
{
    public static IEndpointRouteBuilder MapRecurringEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/recurrings")
            .WithTags("Recurrings")
            .RequireAuthorization();

        group.MapPost("/", CreateRecurringAsync).WithName("CreateRecurring");
        group.MapGet("/", ListRecurringsAsync).WithName("ListRecurrings");
        group.MapPut("/{recurringId:guid}", UpdateRecurringAsync).WithName("UpdateRecurring");
        group.MapPatch("/{recurringId:guid}/deactivate", DeactivateRecurringAsync).WithName("DeactivateRecurring");
        group.MapGet("/{recurringId:guid}/occurrences", ListOccurrencesAsync).WithName("ListRecurringOccurrences");
        group.MapPatch("/occurrences/{occurrenceId:guid}/confirm", ConfirmOccurrenceAsync).WithName("ConfirmRecurringOccurrence");
        group.MapPatch("/occurrences/{occurrenceId:guid}/skip", SkipOccurrenceAsync).WithName("SkipRecurringOccurrence");

        return endpoints;
    }

    private static async Task<IResult> CreateRecurringAsync(
        CreateRecurringRequest request,
        ClaimsPrincipal user,
        IRecurringService recurringService,
        CancellationToken cancellationToken)
    {
        var recurring = await recurringService.CreateAsync(user.GetRequiredUserId(), request, cancellationToken);
        return Results.Created($"/recurrings/{recurring.Id}", recurring);
    }

    private static async Task<IResult> ListRecurringsAsync(
        bool includeInactive,
        ClaimsPrincipal user,
        IRecurringService recurringService,
        CancellationToken cancellationToken)
    {
        var recurrings = await recurringService.ListByUserIdAsync(
            user.GetRequiredUserId(),
            includeInactive,
            cancellationToken);

        return Results.Ok(recurrings);
    }

    private static async Task<IResult> UpdateRecurringAsync(
        Guid recurringId,
        UpdateRecurringRequest request,
        ClaimsPrincipal user,
        IRecurringService recurringService,
        CancellationToken cancellationToken)
    {
        var recurring = await recurringService.UpdateAsync(
            user.GetRequiredUserId(),
            recurringId,
            request,
            cancellationToken);

        return Results.Ok(recurring);
    }

    private static async Task<IResult> DeactivateRecurringAsync(
        Guid recurringId,
        ClaimsPrincipal user,
        IRecurringService recurringService,
        CancellationToken cancellationToken)
    {
        var recurring = await recurringService.DeactivateAsync(
            user.GetRequiredUserId(),
            recurringId,
            cancellationToken);

        return Results.Ok(recurring);
    }

    private static async Task<IResult> ListOccurrencesAsync(
        Guid recurringId,
        ClaimsPrincipal user,
        IRecurringOccurrenceService occurrenceService,
        CancellationToken cancellationToken)
    {
        var occurrences = await occurrenceService.ListByRecurringIdAsync(
            user.GetRequiredUserId(),
            recurringId,
            cancellationToken);

        return Results.Ok(occurrences);
    }

    private static async Task<IResult> ConfirmOccurrenceAsync(
        Guid occurrenceId,
        ConfirmOccurrenceRequest request,
        ClaimsPrincipal user,
        IRecurringOccurrenceService occurrenceService,
        CancellationToken cancellationToken)
    {
        var occurrence = await occurrenceService.ConfirmAsync(
            user.GetRequiredUserId(),
            occurrenceId,
            request,
            cancellationToken);

        return Results.Ok(occurrence);
    }

    private static async Task<IResult> SkipOccurrenceAsync(
        Guid occurrenceId,
        ClaimsPrincipal user,
        IRecurringOccurrenceService occurrenceService,
        CancellationToken cancellationToken)
    {
        var occurrence = await occurrenceService.SkipAsync(
            user.GetRequiredUserId(),
            occurrenceId,
            cancellationToken);

        return Results.Ok(occurrence);
    }
}
