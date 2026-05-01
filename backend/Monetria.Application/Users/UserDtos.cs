namespace Monetria.Application.Users;

public record CreateUserRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password);

public record UserResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Email);