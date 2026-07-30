using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitOutcomeA3B
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(500)]
    public string Outcome { get; set; } = string.Empty; // Nella norma, Eseguita, ecc.

    [StringLength(1000)]
    public string? Notes { get; set; }
}
