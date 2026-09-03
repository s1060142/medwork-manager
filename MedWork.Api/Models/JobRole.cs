using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRole
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string? ISCOCode { get; set; }

    [StringLength(100)]
    public string? RiskCategory { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<JobRoleRiskFactor> JobRoleRiskFactors { get; set; } = new List<JobRoleRiskFactor>();
    public ICollection<Protocol> Protocols { get; set; } = new List<Protocol>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}