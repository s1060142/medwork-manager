using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class RiskFactor
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(500, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Range(1, 5)]
    public int SeverityLevel { get; set; } = 3;

    [StringLength(120)]
    public string? Allegato3BCategory { get; set; }

    [StringLength(50)]
    public string? ICD10Code { get; set; }

    [StringLength(50)]
    public string? INAILCode { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<EmployeeRisk> EmployeeRisks { get; set; } = new List<EmployeeRisk>();
    public ICollection<JobRoleRiskFactor> JobRoleRiskFactors { get; set; } = new List<JobRoleRiskFactor>();
}