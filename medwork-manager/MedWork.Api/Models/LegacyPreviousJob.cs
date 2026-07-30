using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyPreviousJob
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [StringLength(120)]
    public string JobRole { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    [StringLength(500)]
    public string? Risks { get; set; }
}
