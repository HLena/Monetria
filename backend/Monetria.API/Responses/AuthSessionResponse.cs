using Monetria.Application.Auth;

namespace Monetria.API.Responses;

public sealed record AuthSessionUser(Guid UserId, string FirstName, string LastName, string Email);

public sealed record AuthSessionResponse(string Token, AuthSessionUser User)
{
    public static AuthSessionResponse FromAuth(AuthResponse response) =>
        new(
            response.Token,
            new AuthSessionUser(response.UserId, response.FirstName, response.LastName, response.Email));
}
