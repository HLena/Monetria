using Monetria.Application.Transactions;

namespace Monetria.API.Endpoints;

public static class TransactionEndpoints
{
    public static IEndpointRouteBuilder MapTransactionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/transactions")
            .WithTags("Transactions");

        group.MapPost("/", CreateTransactionAsync)
            .WithName("CreateTransaction")
            .RequireAuthorization();

        endpoints.MapGet("/accounts/{accountId:guid}/transactions", ListTransactionsByAccountAsync)
            .WithName("ListTransactionsByAccount")
            .WithTags("Transactions")
            .RequireAuthorization();

        endpoints.MapGet("/users/{userId:guid}/transactions", ListTransactionsByUserAsync)
            .WithName("ListTransactionsByUser")
            .WithTags("Transactions")
            .RequireAuthorization();

        return endpoints;
    }

    private static async Task<IResult> CreateTransactionAsync(
        CreateTransactionRequest request,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        try
        {
            var transaction = await transactionService.CreateAsync(request, cancellationToken);
            return Results.Created($"/transactions/{transaction.Id}", transaction);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Results.NotFound(new { error = exception.Message });
        }
    }

    private static async Task<IResult> ListTransactionsByAccountAsync(
        Guid accountId,
        [AsParameters] TransactionFilterRequest filter,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        try
        {
            var transactions = await transactionService.ListByAccountIdAsync(accountId, filter, cancellationToken);
            return Results.Ok(transactions);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }

    private static async Task<IResult> ListTransactionsByUserAsync(
        Guid userId,
        [AsParameters] TransactionFilterRequest filter,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        try
        {
            var transactions = await transactionService.ListByUserIdAsync(userId, filter, cancellationToken);
            return Results.Ok(transactions);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }
}
