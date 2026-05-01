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
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        try
        {
            var transactions = await transactionService.ListByAccountIdAsync(accountId, cancellationToken);
            return Results.Ok(transactions);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }
}
