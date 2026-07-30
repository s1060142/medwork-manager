using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Allergy
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Code { get; set; }

    public ICollection<VisitAllergy> VisitAllergies { get; set; } = new List<VisitAllergy>();
}

public class VisitAllergy
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int AllergyId { get; set; }
    public Allergy? Allergy { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
