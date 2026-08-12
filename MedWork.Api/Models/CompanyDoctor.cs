using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class CompanyDoctor
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Range(1, int.MaxValue)]
    public int DoctorId { get; set; }

    public bool IsCoordinator { get; set; }

    public DateTime? AssignedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
    public Doctor? Doctor { get; set; }
}