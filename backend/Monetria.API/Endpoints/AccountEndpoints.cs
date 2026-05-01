using Monetria.Application.Accounts;

namespace Monetria.API.Endpoints;

public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/accounts")
            .WithTags("Accounts");

        group.MapPost("/", CreateAccountAsync)
            .WithName("CreateAccount")
            .RequireAuthorization();

        endpoints.MapGet("/users/{userId:guid}/accounts", ListAccountsByUserAsync)
            .WithName("ListAccountsByUser")
            .WithTags("Accounts")
            .RequireAuthorization();

        return endpoints;
    }

    private static async Task<IResult> CreateAccountAsync(
        CreateAccountRequest request,
        IAccountService accountService,
        CancellationToken cancellationToken)
    {
        try
        {
            var account = await accountService.CreateAsync(request, cancellationToken);
            return Results.Created($"/accounts/{account.Id}", account);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }

    private static async Task<IResult> ListAccountsByUserAsync(
        Guid userId,
        IAccountService accountService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accounts = await accountService.ListByUserIdAsync(userId, cancellationToken);
            return Results.Ok(accounts);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }
}
