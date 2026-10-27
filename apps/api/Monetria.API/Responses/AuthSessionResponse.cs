using Monetria.Application.Auth;

namespace Monetria.API.Responses;

public sealed record AuthSessionUser(
    Guid UserId,
    string FirstName,
    string LastName,
    string Email,
    string PreferredCurrency,
    string DateFormat,
    string Theme,
    string? PhoneNumber);

public sealed record AuthSessionResponse(string Token, AuthSessionUser User)
{
    public static AuthSessionResponse FromAuth(AuthResponse r) =>
        new(r.Token,
            new AuthSessionUser(
                r.UserId,
                r.FirstName,
                r.LastName,
                r.Email,
                r.PreferredCurrency,
                r.DateFormat,
                r.Theme,
                r.PhoneNumber));
}
