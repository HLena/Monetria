using System.Security.Claims;

namespace Monetria.API.Endpoints;

internal static class ClaimsPrincipalExtensions
{
    public static Guid GetRequiredUserId(this ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        if (!Guid.TryParse(userId, out var parsedUserId) || parsedUserId == Guid.Empty)
        {
            throw new UnauthorizedAccessException("A valid user claim is required.");
        }

        return parsedUserId;
    }
}
