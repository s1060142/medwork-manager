using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitRisk
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public int RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    public int? RiskUnit { get; set; }
    public double? RiskValue { get; set; }

    public int? TimeUnit { get; set; }
    public int? TimeValue { get; set; }

    public double? Notes { get; set; }

    [StringLength(1)]
    public string? SuitableWithPpe { get; set; }

    [StringLength(1)]
    public string? NotSuitable { get; set; }
}
