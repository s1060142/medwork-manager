using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitProtection
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int PpeId { get; set; }
    public Ppe? Ppe { get; set; }

    [StringLength(1)]
    public string? Used { get; set; } // S/N

    [StringLength(500)]
    public string? Notes { get; set; }
}
