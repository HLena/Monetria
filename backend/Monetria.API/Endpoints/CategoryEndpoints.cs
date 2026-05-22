using System.Security.Claims;
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

        group.MapGet("/", ListCategoriesAsync)
            .WithName("ListCategoriesByUser")
            .WithTags("Categories");

        return endpoints;
    }

    private static async Task<IResult> CreateCategoryAsync(
        CreateCategoryRequest request,
        ClaimsPrincipal user,
        ICategoryService categoryService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var category = await categoryService.CreateAsync(userId, request, cancellationToken);

        return Results.Created($"/categories/{category.Id}", category);
    }

    private static async Task<IResult> ListCategoriesAsync(
        ClaimsPrincipal user,
        ICategoryService categoryService,
        CancellationToken cancellationToken,
        TransactionType? type = null,
        bool includeInactive = false)
    {
        var userId = user.GetRequiredUserId();
        var categories = await categoryService.ListByUserIdAsync(userId, type, includeInactive, cancellationToken);

        return Results.Ok(categories);
    }

    private static async Task<IResult> UpdateCategoryAsync(
        Guid categoryId,
        UpdateCategoryRequest request,
        ClaimsPrincipal user,
        ICategoryService categoryService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var category = await categoryService.UpdateAsync(userId, categoryId, request, cancellationToken);

        return Results.Ok(category);
    }

    private static async Task<IResult> DeactivateCategoryAsync(
        Guid categoryId,
        ClaimsPrincipal user,
        ICategoryService categoryService,
        CancellationToken cancellationToken)
    {
        var userId = user.GetRequiredUserId();
        var category = await categoryService.DeactivateAsync(userId, categoryId, cancellationToken);

        return Results.Ok(category);
    }
}
