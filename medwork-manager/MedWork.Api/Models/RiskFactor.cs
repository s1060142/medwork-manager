using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class RiskFactor
{
    public int Id { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(500, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Range(1, 5)]
    public int SeverityLevel { get; set; } = 3;

    [StringLength(120)]
    public string? Allegato3BCategory { get; set; }

    public ICollection<EmployeeRisk> EmployeeRisks { get; set; } = new List<EmployeeRisk>();
    public ICollection<JobRoleRiskFactor> JobRoleRiskFactors { get; set; } = new List<JobRoleRiskFactor>();
}
