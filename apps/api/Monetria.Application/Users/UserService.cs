using Monetria.Application.Auth;
using Monetria.Application.Common;

namespace Monetria.Application.Users;

public sealed class UserService(
    IUserRepository userRepository,
    IPasswordService passwordService,
    IUnitOfWork unitOfWork) : IUserService
{
    private static readonly HashSet<string> AllowedCurrencies = ["PEN", "USD"];
    private static readonly HashSet<string> AllowedDateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

    public async Task<UserResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        return MapToResponse(user);
    }

    public async Task<UserResponse> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var firstName = request.FirstName?.Trim();
        var lastName = request.LastName?.Trim();

        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("First name is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Last name is required.", nameof(request));

        if (request.PreferredCurrency is not null && !AllowedCurrencies.Contains(request.PreferredCurrency))
            throw new ArgumentException($"Currency must be one of: {string.Join(", ", AllowedCurrencies)}.", nameof(request));

        if (request.DateFormat is not null && !AllowedDateFormats.Contains(request.DateFormat))
            throw new ArgumentException($"Date format must be one of: {string.Join(", ", AllowedDateFormats)}.", nameof(request));

        user.FirstName = firstName;
        user.LastName = lastName;
        if (request.PreferredCurrency is not null) user.PreferredCurrency = request.PreferredCurrency;
        if (request.DateFormat is not null) user.DateFormat = request.DateFormat;

        await userRepository.UpdateAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(user);
    }

    public async Task ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        if (!passwordService.VerifyPassword(user, request.CurrentPassword))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8 || request.NewPassword.Length > 100)
            throw new ArgumentException("New password must be between 8 and 100 characters.", nameof(request));

        user.PasswordHash = passwordService.HashPassword(user, request.NewPassword);

        await userRepository.UpdateAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeactivateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        // Soft delete: mark account as deactivated via a convention field.
        // We store the deactivation by clearing FirstName/LastName and invalidating the email
        // so the account cannot be used again, while preserving FK integrity.
        user.FirstName = "[deleted]";
        user.LastName = string.Empty;
        user.Email = $"deleted_{userId}@deleted.invalid";
        user.PasswordHash = string.Empty;

        await userRepository.UpdateAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static UserResponse MapToResponse(Domain.Entities.User user)
    {
        return new UserResponse(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.PreferredCurrency,
            user.DateFormat);
    }
}
