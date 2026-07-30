using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitPersonalHistory
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(120)]
    public string Pathology { get; set; } = string.Empty;

    public DateTime? OnsetDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
