using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Allegato/Documento generico per gestione documentale
/// </summary>
public class Attachment
{
    public int Id { get; set; }

    [Required]
    [StringLength(250, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Category { get; set; } // es. "Referto", "Certificato", "Scheda sicurezza", "Verbale", "Altro"

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
    public string StoragePath { get; set; } = string.Empty; // Percorso su filesystem/Blob storage

    public string? Checksum { get; set; } // SHA256 per integrità

    public int? EmployeeId { get; set; }
    public int? CompanyId { get; set; }
    public int? MedicalVisitId { get; set; }
    public int? RiskFactorId { get; set; }
    public int? SiteVisitId { get; set; }

    public bool IsConfidential { get; set; } = false; // GDPR: dati sensibili
    public bool IsArchived { get; set; } = false;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string UploadedBy { get; set; } = string.Empty; // User ID o nome

    public DateTime? ExpiresAt { get; set; } // Scadenza documento (es. certificati)

    // Navigation properties
    public Employee? Employee { get; set; }
    public Company? Company { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }
    public RiskFactor? RiskFactor { get; set; }
    public SiteVisit? SiteVisit { get; set; }
}