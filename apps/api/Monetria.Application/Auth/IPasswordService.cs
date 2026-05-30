using Monetria.Domain.Entities;

namespace Monetria.Application.Auth;

public interface IPasswordService
{
    string HashPassword(User user, string password);
    bool VerifyPassword(User user, string password);
}
