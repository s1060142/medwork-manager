using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRoleRiskFactor
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int JobRoleId { get; set; }

    [Range(1, int.MaxValue)]
    public int RiskFactorId { get; set; }

    [Range(1, 5)]
    public int SeverityLevel { get; set; } = 3;

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public JobRole? JobRole { get; set; }
    public RiskFactor? RiskFactor { get; set; }
}