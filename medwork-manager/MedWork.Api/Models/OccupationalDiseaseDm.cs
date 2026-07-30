using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class OccupationalDiseaseDm
{
    public int Id { get; set; }

    [Required]
    [StringLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(300)]
    public string Description { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Icd10Code { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    public ICollection<VisitOccupationalDisease> VisitOccupationalDiseases { get; set; } = new List<VisitOccupationalDisease>();
}
