using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitFamilyHistory
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(120)]
    public string Pathology { get; set; } = string.Empty;

    [StringLength(120)]
    public string? FamilyMember { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
