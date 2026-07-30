using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Ppe
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Category { get; set; } // Respiratori, Protezione occhi, ecc.

    [StringLength(100)]
    public string? Standard { get; set; } // EN 149, EN 166, ecc.

    [StringLength(100)]
    public string? ProtectionLevel { get; set; } // FFP2, FFP3, ecc.

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Manufacturer { get; set; }

    [StringLength(100)]
    public string? Model { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public int? RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    public ICollection<EmployeePpe> EmployeePpes { get; set; } = new List<EmployeePpe>();
    public ICollection<JobRolePpe> JobRolePpes { get; set; } = new List<JobRolePpe>();
}
