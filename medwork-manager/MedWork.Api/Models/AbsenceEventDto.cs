using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// DTO per evento assenza da sistema HR
/// </summary>
public class AbsenceEventDto
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    [StringLength(16)]
    public string TaxCode { get; set; } = string.Empty;

    public int EmployeeId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    [StringLength(50)]
    public string AbsenceType { get; set; } = string.Empty; // "Malattia", "Infortunio", "Maternità", "Permesso", "Ferie"

    [StringLength(1000)]
    public string? Notes { get; set; }
}
