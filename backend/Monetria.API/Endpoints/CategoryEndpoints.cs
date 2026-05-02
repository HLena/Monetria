using Monetria.Application.Categories;
using Monetria.Domain.Enums;

namespace Monetria.API.Endpoints;

public static class CategoryEndpoints
{
    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/categories")
            .WithTags("Categories")
            .RequireAuthorization();

        group.MapPost("/", CreateCategoryAsync)
            .WithName("CreateCategory");

        group.MapPatch("/{categoryId:guid}", UpdateCategoryAsync)
            .WithName("UpdateCategory");

        group.MapPatch("/{categoryId:guid}/deactivate", DeactivateCategoryAsync)
            .WithName("DeactivateCategory");

        endpoints.MapGet("/users/{userId:guid}/categories", ListCategoriesByUserAsync)
            .WithName("ListCategoriesByUser")
            .WithTags("Categories")
            .RequireAuthorization();

        return endpoints;
    }

    private static async Task<IResult> CreateCategoryAsync(
        CreateCategoryRequest request,
        ICategoryService categoryService,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await categoryService.CreateAsync(request, cancellationToken);
            return Results.Created($"/categories/{category.Id}", category);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }

    private static async Task<IResult> ListCategoriesByUserAsync(
        Guid userId,
        TransactionType? type,
        bool includeInactive,
        ICategoryService categoryService,
        CancellationToken cancellationToken)
    {
        try
        {
            var categories = await categoryService.ListByUserIdAsync(userId, type, includeInactive, cancellationToken);
            return Results.Ok(categories);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }

    private static async Task<IResult> UpdateCategoryAsync(
        Guid categoryId,
        UpdateCategoryRequest request,
        ICategoryService categoryService,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await categoryService.UpdateAsync(categoryId, request, cancellationToken);
            return Results.Ok(category);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }

    private static async Task<IResult> DeactivateCategoryAsync(
        Guid categoryId,
        DeactivateCategoryRequest request,
        ICategoryService categoryService,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await categoryService.DeactivateAsync(categoryId, request, cancellationToken);
            return Results.Ok(category);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }
}
