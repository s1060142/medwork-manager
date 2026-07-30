using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitCovid
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public bool TestedPositive { get; set; }
    public DateTime? TestDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
