namespace Monetria.Application.Users;

public interface IUserService
{
    Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}