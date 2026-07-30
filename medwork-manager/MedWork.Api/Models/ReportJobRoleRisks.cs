using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ReportJobRoleRisks
{
    public int Id { get; set; }

    public int JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    public int ExposureLevel { get; set; }
    public int Frequency { get; set; }

    public bool IsMandatory { get; set; } = true;
}
