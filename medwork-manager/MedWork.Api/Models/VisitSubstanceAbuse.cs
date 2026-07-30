using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Substance
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Code { get; set; }

    public ICollection<VisitSubstanceAbuse> VisitSubstanceAbuses { get; set; } = new List<VisitSubstanceAbuse>();
}

public class VisitSubstanceAbuse
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int SubstanceId { get; set; }
    public Substance? Substance { get; set; }

    public bool PastUse { get; set; }
    public bool CurrentUse { get; set; }
}
