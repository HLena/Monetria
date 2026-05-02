using Monetria.Application.Common;

namespace Monetria.Application.Users;

public sealed class UserService(IUserRepository userRepository) : IUserService
{
    public async Task<UserResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        return new UserResponse(user.Id, user.FirstName, user.LastName, user.Email);
    }
}