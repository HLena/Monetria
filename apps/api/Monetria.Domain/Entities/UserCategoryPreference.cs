namespace Monetria.Domain.Entities;

public class UserCategoryPreference
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    public bool IsActive { get; set; }
}
