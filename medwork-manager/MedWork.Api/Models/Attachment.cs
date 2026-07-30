using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Attachment
{
    public int Id { get; set; }

    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [StringLength(500)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [Required]
    [StringLength(500)]
    public string StoragePath { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Checksum { get; set; }

    public bool IsConfidential { get; set; }
    public bool IsArchived { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [StringLength(120)]
    public string UploadedBy { get; set; } = string.Empty;

    public DateTime? ExpiresAt { get; set; }

    // Optional references
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public int? MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int? RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    public int? SiteVisitId { get; set; }
    public SiteVisit? SiteVisit { get; set; }

    public int? InjuryId { get; set; }
}
