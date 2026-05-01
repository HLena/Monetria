using System.ComponentModel.DataAnnotations;
using Monetria.Application.Auth;
using Monetria.Application.Common;
using Monetria.Domain.Entities;

namespace Monetria.Application.Users;

public sealed class UserService(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordService passwordService) : IUserService
{
    public async Task<UserResponse> CreateAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCreateRequest(request);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await userRepository.ExistsUserWithEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new ArgumentException("Email already exists.", nameof(request));
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwordService.HashPassword(user, request.Password);

        await userRepository.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new UserResponse(user.Id, user.FirstName, user.LastName, user.Email);
    }

    public async Task<UserResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found.", nameof(id));
        }
        return new UserResponse(user.Id, user.FirstName, user.LastName, user.Email);
    }

    private static void ValidateCreateRequest(CreateUserRequest request)
    {
        if (string.IsNullOrEmpty(request.FirstName))
        {
            throw new ArgumentException("First name is required.", nameof(request));
        }
        if (string.IsNullOrEmpty(request.LastName))
        {
            throw new ArgumentException("Last name is required.", nameof(request));
        }
        if (string.IsNullOrEmpty(request.Email))
        {
            throw new ArgumentException("Email is required.", nameof(request));
        }
        if (string.IsNullOrEmpty(request.Password))
        {
            throw new ArgumentException("Password is required.", nameof(request));
        }
        if (!IsValidPassword(request.Password))
        {
            throw new ArgumentException("Password is not valid.", nameof(request));
        }
        if (!IsValidEmail(request.Email))
        {
            throw new ArgumentException("Invalid email address.", nameof(request));
        }
    }

    private static bool IsValidEmail(string email)
    {
        return new EmailAddressAttribute().IsValid(email);
    }

    private static bool IsValidPassword(string password)
    {
        return password.Length >= 8 && password.Length <= 100;
    }
}