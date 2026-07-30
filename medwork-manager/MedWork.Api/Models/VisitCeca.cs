using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitCeca
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
