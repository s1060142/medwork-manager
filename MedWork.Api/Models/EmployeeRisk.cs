using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class EmployeeRisk
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Range(1, int.MaxValue)]
    public int RiskFactorId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RemovedAt { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Employee? Employee { get; set; }
    public RiskFactor? RiskFactor { get; set; }
}