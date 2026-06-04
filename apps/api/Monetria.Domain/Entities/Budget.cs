using Monetria.Domain.Enums;

namespace Monetria.Domain.Entities;

public class Budget
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public Guid CategoryId { get; set; }
    public decimal LimitAmount { get; set; }

    public int Month { get; set; }
    public int Year { get; set; }

    public bool RolloverUnused { get; set; }

    public DateTime CreatedAt { get; set; }
}