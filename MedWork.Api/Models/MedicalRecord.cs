using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MedicalRecord
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [StringLength(4000)]
    public string? MedicalHistory { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }

    [StringLength(2000)]
    public string? CurrentTherapies { get; set; }

    [StringLength(2000)]
    public string? Allergies { get; set; }

    [StringLength(2000)]
    public string? FamilyHistory { get; set; }

    public MedicalRecordStatus Status { get; set; } = MedicalRecordStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Employee? Employee { get; set; }
}