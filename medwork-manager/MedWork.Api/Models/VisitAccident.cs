using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitAccident
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public DateTime AccidentDate { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public int DaysLost { get; set; }
}
