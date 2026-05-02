using Monetria.Application.Common;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;

namespace Monetria.Application.Categories;

public sealed class CategoryService(
    ICategoryRepository categoryRepository,
    IUnitOfWork unitOfWork) : ICategoryService
{
    public async Task<CategoryResponse> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(request.UserId);
        var name = NormalizeName(request.Name);

        await EnsureNameIsAvailableAsync(
            request.UserId,
            request.Type,
            name,
            excludedCategoryId: null,
            cancellationToken);

        var now = DateTime.UtcNow;
        var category = new Category
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = name,
            Type = request.Type,
            Color = NormalizeColor(request.Color),
            IsDefault = false,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        await categoryRepository.AddAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(category);
    }

    public async Task<IReadOnlyList<CategoryResponse>> ListByUserIdAsync(
        Guid userId,
        TransactionType? type = null,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var categories = await categoryRepository.ListByUserIdAsync(
            userId,
            type,
            includeInactive,
            cancellationToken);

        return categories
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<CategoryResponse> UpdateAsync(
        Guid categoryId,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCategoryId(categoryId);
        ValidateUserId(request.UserId);

        var category = await GetEditableCategoryAsync(categoryId, request.UserId, cancellationToken);
        var name = NormalizeName(request.Name);

        await EnsureNameIsAvailableAsync(
            request.UserId,
            category.Type,
            name,
            category.Id,
            cancellationToken);

        category.Name = name;
        category.Color = NormalizeColor(request.Color);
        category.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(category);
    }

    public async Task<CategoryResponse> DeactivateAsync(
        Guid categoryId,
        DeactivateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCategoryId(categoryId);
        ValidateUserId(request.UserId);

        var category = await GetEditableCategoryAsync(categoryId, request.UserId, cancellationToken);
        category.IsActive = false;
        category.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(category);
    }

    private async Task<Category> GetEditableCategoryAsync(
        Guid categoryId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsync(categoryId, cancellationToken)
            ?? throw new InvalidOperationException($"Category '{categoryId}' was not found.");

        if (category.IsDefault)
        {
            throw new InvalidOperationException("Default categories cannot be modified.");
        }

        if (category.UserId != userId)
        {
            throw new InvalidOperationException("Category does not belong to the user.");
        }

        return category;
    }

    private async Task EnsureNameIsAvailableAsync(
        Guid userId,
        TransactionType type,
        string name,
        Guid? excludedCategoryId,
        CancellationToken cancellationToken)
    {
        var nameExists = await categoryRepository.ExistsByNameAsync(
            userId,
            type,
            name,
            excludedCategoryId,
            cancellationToken);

        if (nameExists)
        {
            throw new InvalidOperationException("A category with the same name and type already exists.");
        }
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static void ValidateCategoryId(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException("Category id is required.", nameof(categoryId));
        }
    }

    private static string NormalizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Category name is required.", nameof(name));
        }

        return name.Trim();
    }

    private static string? NormalizeColor(string? color)
    {
        return string.IsNullOrWhiteSpace(color) ? null : color.Trim();
    }

    private static CategoryResponse MapToResponse(Category category)
    {
        return new CategoryResponse(
            category.Id,
            category.UserId,
            category.Name,
            category.Type,
            category.IsDefault,
            category.IsActive,
            category.Color,
            category.CreatedAt,
            category.UpdatedAt);
    }
}
