using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitPreviousJob
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [StringLength(120)]
    public string JobRole { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    [StringLength(500)]
    public string? Risks { get; set; }
}
