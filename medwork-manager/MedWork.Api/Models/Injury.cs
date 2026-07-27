using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Infortunio sul lavoro - D.Lgs 81/08 e D.P.R. 1124/65
/// </summary>
public class Injury
{
    public int Id { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Required]
    public DateTime InjuryDate { get; set; }

    [Required]
    public DateTime ReportDate { get; set; }

    [Required]
    [StringLength(50)]
    public string InjuryType { get; set; } = string.Empty; // "Lieve", "Grave", "Mortale", "In itinere"

    [Required]
    [StringLength(120)]
    public string BodyPart { get; set; } = string.Empty;

    [StringLength(120)]
    public string? InjuryNature { get; set; } // "Frattura", "Contusione", "Taglio", "Ustione", ecc.

    [Required]
    [StringLength(500)]
    public string Cause { get; set; } = string.Empty;

    [StringLength(250)]
    public string? Location { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    public int DaysLost { get; set; }

    public DateTime? ReturnToWorkDate { get; set; }

    public bool IsReportedToInail { get; set; } = false;

    [StringLength(100)]
    public string? InailReportNumber { get; set; }

    public DateTime? InailReportDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Aperto"; // "Aperto", "In corso", "Chiuso", "Contestato"

    [StringLength(2000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [StringLength(120)]
    public string CreatedBy { get; set; } = "system";

    [StringLength(120)]
    public string UpdatedBy { get; set; } = "system";

    // Navigation properties
    public Employee? Employee { get; set; }
    public Company? Company { get; set; }
    public ICollection<InjuryAttachment> InjuryAttachments { get; set; } = new List<InjuryAttachment>();
}

/// <summary>
/// Allegati specifici per infortunio (referti, verbali, foto, ecc.)
/// </summary>
public class InjuryAttachment
{
    public int InjuryId { get; set; }
    public int AttachmentId { get; set; }

    // Navigation properties
    public Injury? Injury { get; set; }
    public Attachment? Attachment { get; set; }
}