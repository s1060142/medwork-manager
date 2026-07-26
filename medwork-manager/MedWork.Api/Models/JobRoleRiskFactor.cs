namespace MedWork.Api.Models;

public class JobRoleRiskFactor
{
    public int JobRoleId { get; set; }
    public int RiskFactorId { get; set; }

    public JobRole? JobRole { get; set; }
    public RiskFactor? RiskFactor { get; set; }
}