using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacySubstanceAbuse
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(120)]
    public string Substance { get; set; } = string.Empty;

    public bool PastUse { get; set; }
    public bool CurrentUse { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
