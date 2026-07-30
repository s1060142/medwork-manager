using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyOccupationalDisease
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(120)]
    public string DiseaseName { get; set; } = string.Empty;

    [StringLength(50)]
    public string? IcdCode { get; set; }

    public DateTime? DiagnosisDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
