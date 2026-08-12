using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Department
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Manager { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? ManagerEmail { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}