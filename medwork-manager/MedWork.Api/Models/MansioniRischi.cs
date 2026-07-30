using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class MansioniRischi
{
    public int Id { get; set; }

    [StringLength(120)]
    public string Mansione { get; set; } = string.Empty;

    public int RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    public int LivelloEsposizione { get; set; }
}
