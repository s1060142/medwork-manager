using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyVaccination
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(120)]
    public string VaccineName { get; set; } = string.Empty;

    public DateTime VaccinationDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public int? PeriodMonths { get; set; }
}
