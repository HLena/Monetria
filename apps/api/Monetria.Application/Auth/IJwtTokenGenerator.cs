using Monetria.Domain.Entities;

namespace Monetria.Application.Auth;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
