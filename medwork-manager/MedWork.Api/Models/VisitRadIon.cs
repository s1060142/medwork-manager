using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class VisitRadIon
{
    public int Id { get; set; }

    public int MedicalVisitId { get; set; }
    public MedicalVisit? MedicalVisit { get; set; }

    public bool ExternalExposure { get; set; }
    [StringLength(500)]
    public string? ExternalDetails { get; set; }

    public bool InternalExposure { get; set; }
    [StringLength(500)]
    public string? InternalDetails { get; set; }

    [StringLength(120)]
    public string? Classification { get; set; }

    [StringLength(500)]
    public string? PreviousExposure { get; set; }

    public double? TotalExposure { get; set; }
    public double? AccidentalExposure { get; set; }
    public double? EmergencyExposure { get; set; }
    public double? AuthorizedExposure { get; set; }

    public double? AccidentalDose { get; set; }
    public double? EffectiveDoseInternal { get; set; }
    public double? EffectiveDoseExternal { get; set; }

    public DateTime? IncorporationDate { get; set; }

    [StringLength(50)]
    public string? Fitness { get; set; }

    public int? ValidityMonths { get; set; }
}
