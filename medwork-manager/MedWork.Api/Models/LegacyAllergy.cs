using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyAllergy
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(120)]
    public string Allergen { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Reaction { get; set; }

    public DateTime? OnsetDate { get; set; }
}
