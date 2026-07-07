namespace Monetria.Application.Users;

public record UserResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string PreferredCurrency,
    string DateFormat,
    string Theme,
    string? PhoneNumber);

public sealed record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string? PreferredCurrency,
    string? DateFormat,
    string? Theme,
    string? PhoneNumber);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);