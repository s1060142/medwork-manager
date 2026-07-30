using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class JobRoleRiskFactor
{
    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool IsMandatory { get; set; } = true;
}
