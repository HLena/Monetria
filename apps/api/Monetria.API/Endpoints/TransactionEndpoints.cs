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

        group.MapGet("/monthly-flow", GetMonthlyFlowAsync)
            .WithName("GetMonthlyFlow");

        group.MapGet("/spending-by-category", GetSpendingByCategoryAsync)
            .WithName("GetSpendingByCategory");

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

    private static async Task<IResult> GetMonthlyFlowAsync(
        ClaimsPrincipal user,
        ITransactionService transactionService,
        int months = 6,
        string granularity = "month",
        CancellationToken cancellationToken = default)
    {
        if (!new[] { 1, 3, 6, 12 }.Contains(months))
            return Results.BadRequest("months must be 1, 3, 6, or 12.");

        if (granularity != "month" && granularity != "week")
            return Results.BadRequest("granularity must be 'month' or 'week'.");

        if (granularity == "week" && months != 1)
            return Results.BadRequest("granularity 'week' requires months=1.");

        var userId = user.GetRequiredUserId();
        var result = granularity == "week"
            ? await transactionService.GetWeeklyFlowAsync(userId, cancellationToken)
            : await transactionService.GetMonthlyFlowAsync(userId, months, cancellationToken);

        return Results.Ok(result);
    }

    private static async Task<IResult> GetSpendingByCategoryAsync(
        ClaimsPrincipal user,
        ITransactionService transactionService,
        int months = 1,
        CancellationToken cancellationToken = default)
    {
        if (!new[] { 1, 3, 6, 12 }.Contains(months))
            return Results.BadRequest("months must be 1, 3, 6, or 12.");

        var userId = user.GetRequiredUserId();
        var result = await transactionService.GetSpendingByCategoryAsync(userId, months, cancellationToken);
        return Results.Ok(result);
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
        string? startDate,
        string? endDate,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var resolvedFilter = filter with { StartDate = startDate, EndDate = endDate };
        var summary = await transactionService.GetSummaryAsync(userId, resolvedFilter, cancellationToken);
        return Results.Ok(summary);
    }

    private static async Task<IResult> ListTransactionsAsync(
        [AsParameters] TransactionFilterRequest filter,
        string? startDate,
        string? endDate,
        ClaimsPrincipal user,
        ITransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var resolvedFilter = filter with { StartDate = startDate, EndDate = endDate };
        var paged = await transactionService.ListByUserIdAsync(userId, resolvedFilter, cancellationToken);

        return Results.Ok(paged);
    }
}
