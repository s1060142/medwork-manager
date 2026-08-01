using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// DTO per aggiornamento valutazione del rischio
/// </summary>
public class RiskAssessmentUpdateDto
{
    [Required]
    public int RiskFactorId { get; set; }

    public int? JobRoleId { get; set; }

    [Required]
    [Range(1, 5)]
    public int CurrentRiskLevel { get; set; }

    [Required]
    [Range(1, 5)]
    public int TargetRiskLevel { get; set; }

    [StringLength(2000)]
    public string? ControlMeasures { get; set; }

    [StringLength(120)]
    public string? ResponsiblePerson { get; set; }

    public DateTime? ReviewDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}