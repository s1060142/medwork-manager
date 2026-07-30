using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Injury
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public DateTime InjuryDate { get; set; }
    public DateTime ReportDate { get; set; }

    [Required]
    [StringLength(50)]
    public string InjuryType { get; set; } = string.Empty; // Lieve, Grave, Mortale, In itinere

    [Required]
    [StringLength(120)]
    public string BodyPart { get; set; } = string.Empty;

    [StringLength(120)]
    public string? InjuryNature { get; set; } // Frattura, Contusione, Taglio, Ustione

    [Required]
    [StringLength(500)]
    public string Cause { get; set; } = string.Empty;

    [StringLength(250)]
    public string? Location { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Note aggiuntive (alias per Description per compatibilità)
    /// </summary>
    [StringLength(2000)]
    public string? Notes 
    { 
        get => Description; 
        set => Description = value; 
    }

    public int DaysLost { get; set; }

    /// <summary>
    /// Data rientro al lavoro
    /// </summary>
    public DateTime? ReturnToWorkDate { get; set; }

    public bool IsReportedToInail { get; set; }

    [StringLength(100)]
    public string? InailReportNumber { get; set; }

    public DateTime? InailReportDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Aperto"; // Aperto, In corso, Chiuso, Contestato

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(120)]
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Utente che ha aggiornato l'infortunio
    /// </summary>
    [StringLength(120)]
    public string? UpdatedBy { get; set; }

    public ICollection<InjuryAttachment> InjuryAttachments { get; set; } = new List<InjuryAttachment>();
}
