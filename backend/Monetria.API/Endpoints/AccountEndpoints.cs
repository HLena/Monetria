using System.Security.Claims;
using Monetria.Application.Accounts;
using Monetria.Domain.Enums;

namespace Monetria.API.Endpoints;

public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/accounts")
            .WithTags("Accounts")
            .RequireAuthorization();

        group.MapPost("/", CreateAccountAsync)
            .WithName("CreateAccount");

        group.MapGet("/", ListAccountsAsync)
            .WithName("ListAccountsByUser")
            .WithTags("Accounts");

        return endpoints;
    }

    private static async Task<IResult> CreateAccountAsync(
        CreateAccountRequest request,
        ClaimsPrincipal user,
        IAccountService accountService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var account = await accountService.CreateAsync(userId, request, cancellationToken);

        return Results.Created($"/accounts/{account.Id}", account);
    }

    private static async Task<IResult> ListAccountsAsync(
        AccountType? type,
        ClaimsPrincipal user,
        IAccountService accountService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var accounts = await accountService.ListByUserIdAsync(userId, type, cancellationToken);

        return Results.Ok(accounts);
    }
}
