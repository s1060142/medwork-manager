using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyRisk
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(120)]
    public string RiskName { get; set; } = string.Empty;

    public double? Value { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
