using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class EmployeeRisk
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
}
