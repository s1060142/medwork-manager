using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitInjury
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public DateTime InjuryDate { get; set; }

    [StringLength(50)]
    public string InjuryType { get; set; } = string.Empty; // Lieve, Grave, Mortale, In itinere

    [StringLength(120)]
    public string BodyPart { get; set; } = string.Empty;

    [StringLength(120)]
    public string? InjuryNature { get; set; } // Frattura, Contusione, Taglio, Ustione, ecc.

    [StringLength(500)]
    public string Cause { get; set; } = string.Empty;

    [StringLength(250)]
    public string? Location { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    public int DaysLost { get; set; }

    public bool IsReportedToInail { get; set; }

    [StringLength(100)]
    public string? InailReportNumber { get; set; }

    public DateTime? InailReportDate { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Aperto"; // Aperto, In corso, Chiuso, Contestato
}
