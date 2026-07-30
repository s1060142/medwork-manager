using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class LegacyEmployee
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [StringLength(150)]
    public string? FullName { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public int? CompanyId { get; set; }
}
