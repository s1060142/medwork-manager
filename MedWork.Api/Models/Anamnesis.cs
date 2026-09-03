using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Anamnesis
{
    public int Id { get; set; }

    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int MedicalVisitId { get; set; }

    [StringLength(4000)]
    public string? WorkHistory { get; set; }

    [StringLength(4000)]
    public string? PersonalHistory { get; set; }

    [StringLength(4000)]
    public string? FamilyHistory { get; set; }

    [StringLength(4000)]
    public string? RemotePathology { get; set; }

    [StringLength(4000)]
    public string? RecentPathology { get; set; }

    [StringLength(4000)]
    public string? LifestyleHabits { get; set; }

    [StringLength(4000)]
    public string? OccupationalExposures { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }
}