using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitUpperLimb
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(50)]
    public string Examination { get; set; } = string.Empty; // Arto sup, Cavi, etc.

    public int? RightValue { get; set; }
    [StringLength(1)]
    public string? RightFlag { get; set; }

    public int? LeftValue { get; set; }
    [StringLength(1)]
    public string? LeftFlag { get; set; }

    [StringLength(1)]
    public string? BilateralFlag { get; set; }
}
