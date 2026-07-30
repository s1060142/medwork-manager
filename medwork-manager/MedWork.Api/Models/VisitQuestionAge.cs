using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitQuestionAge
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(500)]
    public string Question { get; set; } = string.Empty;

    [StringLength(1)]
    public string? Answer { get; set; } // S/N
}
