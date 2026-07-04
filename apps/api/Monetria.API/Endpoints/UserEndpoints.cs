using System.Security.Claims;
using Monetria.Application.Users;

namespace Monetria.API.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("/me", GetMeAsync)
            .WithName("GetMe");

        group.MapPatch("/me", UpdateProfileAsync)
            .WithName("UpdateProfile");

        group.MapPost("/me/change-password", ChangePasswordAsync)
            .WithName("ChangePassword");

        group.MapDelete("/me", DeactivateAsync)
            .WithName("DeactivateAccount");

        // Legacy: keep for backward compatibility
        group.MapGet("/{id:guid}", GetUserByIdAsync)
            .WithName("GetUserById");

        return endpoints;
    }

    private static async Task<IResult> GetMeAsync(
        ClaimsPrincipal user,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var result = await userService.GetByIdAsync(userId, cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> UpdateProfileAsync(
        UpdateProfileRequest request,
        ClaimsPrincipal user,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var result = await userService.UpdateProfileAsync(userId, request, cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> ChangePasswordAsync(
        ChangePasswordRequest request,
        ClaimsPrincipal user,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        await userService.ChangePasswordAsync(userId, request, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> DeactivateAsync(
        ClaimsPrincipal user,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        await userService.DeactivateAsync(userId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetUserByIdAsync(
        Guid id,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var user = await userService.GetByIdAsync(id, cancellationToken);
        return Results.Ok(user);
    }
}
