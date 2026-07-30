using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitSpine
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(120)]
    public string Region { get; set; } = string.Empty; // Cervicale, Dorso, Lombare

    [StringLength(50)]
    public string Examination { get; set; } = string.Empty;

    public int? Value { get; set; }

    [StringLength(1)]
    public string? Pain { get; set; }

    [StringLength(1)]
    public string? Limitation { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
