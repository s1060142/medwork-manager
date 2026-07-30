using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyProtection
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public LegacyEmployee? Employee { get; set; }

    [StringLength(120)]
    public string PpeName { get; set; } = string.Empty;

    [StringLength(1)]
    public string? Used { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
