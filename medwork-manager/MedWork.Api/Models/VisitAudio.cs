using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitAudio
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int? Frequency { get; set; }
    public int? RightEar { get; set; }
    public int? LeftEar { get; set; }
    public int? Outcome { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
