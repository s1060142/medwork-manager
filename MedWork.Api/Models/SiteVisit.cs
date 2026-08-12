using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class SiteVisit
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Range(1, int.MaxValue)]
    public int? WorkLocationId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string VisitedStructure { get; set; } = string.Empty;

    [StringLength(250)]
    public string? Location { get; set; }

    [Range(1, int.MaxValue)]
    public int? DoctorId { get; set; }

    [StringLength(120)]
    public string? DoctorName { get; set; }

    [Required]
    public DateTime VisitDate { get; set; }

    [StringLength(100)]
    public string? Frequency { get; set; }

    public DateTime? NextDueDate { get; set; }

    [StringLength(4000)]
    public string? Notes { get; set; }

    [StringLength(50)]
    public string? Outcome { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
    public WorkLocation? WorkLocation { get; set; }
    public Doctor? Doctor { get; set; }
}