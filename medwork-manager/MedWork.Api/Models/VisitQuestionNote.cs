using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitQuestionNote
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(500)]
    public string Question { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Answer { get; set; }
}
