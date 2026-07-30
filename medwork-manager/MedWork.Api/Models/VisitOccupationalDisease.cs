using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitOccupationalDisease
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(120)]
    public string DiseaseName { get; set; } = string.Empty;

    [StringLength(50)]
    public string? IcdCode { get; set; }

    public DateTime? DiagnosisDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
