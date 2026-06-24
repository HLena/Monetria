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

        group.MapGet("/", ListTransactionsAsync)
            .WithName("ListTransactionsByUser");

        group.MapGet("/summary", GetTransactionSummaryAsync)
            .WithName("GetTransactionSummary");

        group.MapGet("/{id:guid}", GetTransactionByIdAsync)
            .WithName("GetTransactionById");

        group.MapPut("/{id:guid}", UpdateTransactionAsync)
            .WithName("UpdateTransaction");

        group.MapDelete("/{id:guid}", DeleteTransactionAsync)
            .WithName("DeleteTransaction");

        endpoints.MapGet("/accounts/{accountId:guid}/transactions", ListTransactionsByAccountAsync)
            .WithName("ListTransactionsByAccount")
            .WithTags("Transactions")
            .RequireAuthorization();

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

    private static async Task<IResult> GetTransactionByIdAsync(
        Guid id,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var transaction = await transactionService.GetByIdAsync(userId, id, cancellationToken);

        return Results.Ok(transaction);
    }

    private static async Task<IResult> UpdateTransactionAsync(
        Guid id,
        UpdateTransactionRequest request,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var transaction = await transactionService.UpdateAsync(userId, id, request, cancellationToken);

        return Results.Ok(transaction);
    }

    private static async Task<IResult> DeleteTransactionAsync(
        Guid id,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        await transactionService.DeleteAsync(userId, id, cancellationToken);

        return Results.NoContent();
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

    private static async Task<IResult> GetTransactionSummaryAsync(
        [AsParameters] TransactionFilterRequest filter,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var summary = await transactionService.GetSummaryAsync(userId, filter, cancellationToken);
        return Results.Ok(summary);
    }

    private static async Task<IResult> ListTransactionsAsync(
        [AsParameters] TransactionFilterRequest filter,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var paged = await transactionService.ListByUserIdAsync(userId, filter, cancellationToken);

        return Results.Ok(paged);
    }
}
