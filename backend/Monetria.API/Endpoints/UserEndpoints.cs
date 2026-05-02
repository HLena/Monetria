using Monetria.Application.Users;

namespace Monetria.API.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/users")
            .WithTags("Users");

        group.MapGet("/{id:guid}", GetUserByIdAsync)
            .WithName("GetUserById")
            .RequireAuthorization();

        return endpoints;
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