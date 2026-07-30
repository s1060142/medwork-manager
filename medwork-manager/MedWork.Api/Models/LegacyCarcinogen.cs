using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyCarcinogen
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(120)]
    public string Substance { get; set; } = string.Empty;

    public DateTime? ExposureStart { get; set; }
    public DateTime? ExposureEnd { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
