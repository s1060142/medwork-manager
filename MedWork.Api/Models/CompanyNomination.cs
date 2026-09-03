using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class CompanyNomination
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    public int? EmployeeId { get; set; }

    [Required]
    [StringLength(200)]
    public string RoleName { get; set; } = string.Empty;

    public DateTime? CertificationExpiry { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Valid"; // Valid, Expiring, Expired, Missing

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
    public Employee? Employee { get; set; }
}
