using Monetria.Application.Users;

namespace Monetria.API.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/users")
            .WithTags("Users");
        
        group.MapPost("/", CreateUserAsync)
            .WithName("CreateUser");

        group.MapGet("/{id:guid}", GetUserByIdAsync)
            .WithName("GetUserById");

        return endpoints;
    }

    private static async Task<IResult> CreateUserAsync(
        CreateUserRequest request,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await userService.CreateAsync(request, cancellationToken);
            return Results.Created($"/users/{user.Id}", user);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }

    private static async Task<IResult> GetUserByIdAsync(
        Guid id,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await userService.GetByIdAsync(id, cancellationToken);
            return Results.Ok(user);
        }
        catch (ArgumentException exception)
        {
            return Results.NotFound(new { error = exception.Message });
        }
    }
}