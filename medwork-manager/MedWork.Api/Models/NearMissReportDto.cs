using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// DTO per segnalazione near-miss/quasi incidente
/// </summary>
public class NearMissReportDto
{
    [Required]
    public int EmployeeId { get; set; }

    [Required]
    public int CompanyId { get; set; }

    public int? BranchId { get; set; }

    public int? DepartmentId { get; set; }

    [Required]
    public DateTime IncidentDate { get; set; }

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Location { get; set; }

    [StringLength(1000)]
    public string? Witnesses { get; set; }

    [StringLength(1000)]
    public string? ImmediateActions { get; set; }

    [StringLength(1000)]
    public string? PotentialConsequences { get; set; }

    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

    [StringLength(120)]
    public string? ReportedBy { get; set; }
}