using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class RiskLevel
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Description { get; set; }

    [StringLength(20)]
    public string? Color { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}