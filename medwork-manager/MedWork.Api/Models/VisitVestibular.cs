using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitVestibular
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [StringLength(500)]
    public string? VestibularExam { get; set; }

    public int? NisSport { get; set; }
    public int? NisPosture { get; set; }
    public int? DeviationInner { get; set; }
    public int? Romberg { get; set; }
    [StringLength(500)]
    public string? Indications { get; set; }
    public int? March { get; set; }
    public int? Halmagyi { get; set; }
    public int? Fukuda { get; set; }
    [StringLength(500)]
    public string? Conclusion { get; set; }
}
