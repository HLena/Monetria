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
            .WithName("CreateAccount")
            .WithSummary("Create a new account");

        group.MapGet("/", ListAccountsAsync)
            .WithName("ListAccountsByUser")
            .WithTags("Accounts")
            .WithSummary("List accounts by user");

        group.MapGet("/{id:guid}", GetAccountByIdAsync)
            .WithName("GetAccountById")
            .WithSummary("Get account by id");

        group.MapPut("/{id:guid}", UpdateAccountAsync)
            .WithName("UpdateAccount")
            .WithSummary("Update an existing account");

        group.MapDelete("/{id:guid}", DeleteAccountAsync)
            .WithName("DeleteAccount")
            .WithSummary("Delete an account");

        group.MapGet("/balance/summary", GetUserBalanceAsync)
            .WithName("GetUserBalance")
            .WithSummary("Get user's overall balance (income - expense)");

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

    private static async Task<IResult> UpdateAccountAsync(
        Guid id,
        UpdateAccountRequest request,
        ClaimsPrincipal user,
        IAccountService accountService,
        CancellationToken cancellationToken)
    {
        var account = await accountService.UpdateAsync(user.GetRequiredUserId(), id, request, cancellationToken);
        return Results.Ok(account);
    }

    private static async Task<IResult> DeleteAccountAsync(
        Guid id,
        ClaimsPrincipal user,
        IAccountService accountService,
        CancellationToken cancellationToken)
    {
        await accountService.DeleteAsync(user.GetRequiredUserId(), id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetAccountByIdAsync(
        Guid id,
        ClaimsPrincipal user,
        IAccountService accountService,
        CancellationToken cancellationToken)
    {
        var account = await accountService.GetByIdAsync(user.GetRequiredUserId(), id, cancellationToken);
        return Results.Ok(account);
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

    private static async Task<IResult> GetUserBalanceAsync(
        ClaimsPrincipal user,
        IBalanceService balanceService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var balance = await balanceService.GetUserBalanceAsync(userId, cancellationToken);

        return Results.Ok(balance);
    }
}
