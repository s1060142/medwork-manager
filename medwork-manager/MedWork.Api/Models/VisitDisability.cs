using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitDisability
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(120)]
    public string DisabilityType { get; set; } = string.Empty;

    public int Percentage { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
