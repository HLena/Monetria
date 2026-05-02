using System.Security.Claims;
using Monetria.Application.Transactions;

namespace Monetria.API.Endpoints;

public static class TransactionEndpoints
{
    public static IEndpointRouteBuilder MapTransactionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/transactions")
            .WithTags("Transactions")
            .RequireAuthorization();

        group.MapPost("/", CreateTransactionAsync)
            .WithName("CreateTransaction");

        endpoints.MapGet("/accounts/{accountId:guid}/transactions", ListTransactionsByAccountAsync)
            .WithName("ListTransactionsByAccount")
            .WithTags("Transactions")
            .RequireAuthorization();

        group.MapGet("/", ListTransactionsAsync)
            .WithName("ListTransactionsByUser")
            .WithTags("Transactions");

        return endpoints;
    }

    private static async Task<IResult> CreateTransactionAsync(
        CreateTransactionRequest request,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var transaction = await transactionService.CreateAsync(userId, request, cancellationToken);

        return Results.Created($"/transactions/{transaction.Id}", transaction);
    }

    private static async Task<IResult> ListTransactionsByAccountAsync(
        Guid accountId,
        [AsParameters] TransactionFilterRequest filter,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var transactions = await transactionService.ListByAccountIdAsync(userId, accountId, filter, cancellationToken);

        return Results.Ok(transactions);
    }

    private static async Task<IResult> ListTransactionsAsync(
        [AsParameters] TransactionFilterRequest filter,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var transactions = await transactionService.ListByUserIdAsync(userId, filter, cancellationToken);

        return Results.Ok(transactions);
    }
}
