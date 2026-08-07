namespace MedWork.Api.Models;

public class EmployeeRisk
{
    public int EmployeeId { get; set; }
    public int RiskFactorId { get; set; }

    public Employee? Employee { get; set; }
    public RiskFactor? RiskFactor { get; set; }
}
