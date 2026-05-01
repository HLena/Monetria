using System.ComponentModel.DataAnnotations;
using Monetria.Application.Common;
using Monetria.Application.Users;
using Monetria.Domain.Entities;

namespace Monetria.Application.Auth;

public sealed class AuthService(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordService passwordService,
    IJwtTokenGenerator jwtTokenGenerator) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateRegisterRequest(request);

        var normalizedEmail = NormalizeEmail(request.Email);
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

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateLoginRequest(request);

        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null || !passwordService.VerifyPassword(user, request.Password))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return CreateAuthResponse(user);
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        return new AuthResponse(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            jwtTokenGenerator.GenerateToken(user));
    }

    private static void ValidateRegisterRequest(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName))
        {
            throw new ArgumentException("First name is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.LastName))
        {
            throw new ArgumentException("Last name is required.", nameof(request));
        }

        ValidateEmail(request.Email, nameof(request));
        ValidatePassword(request.Password, nameof(request));
    }

    private static void ValidateLoginRequest(LoginRequest request)
    {
        ValidateEmail(request.Email, nameof(request));

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Password is required.", nameof(request));
        }
    }

    private static void ValidateEmail(string email, string paramName)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", paramName);
        }

        if (!new EmailAddressAttribute().IsValid(email))
        {
            throw new ArgumentException("Invalid email address.", paramName);
        }
    }

    private static void ValidatePassword(string password, string paramName)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required.", paramName);
        }

        if (password.Length < 8 || password.Length > 100)
        {
            throw new ArgumentException("Password is not valid.", paramName);
        }
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
