using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class CompanyGroup
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? LegalName { get; set; }

    [StringLength(250)]
    public string? Address { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(10)]
    public string? PostalCode { get; set; }

    [StringLength(100)]
    public string? Province { get; set; }

    [RegularExpression("^[A-Z]{2}[0-9]{11}$|^[0-9]{11}$")]
    public string? VATNumber { get; set; }

    [StringLength(16)]
    public string? TaxCode { get; set; }

    public bool SingleArchive { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<Company> Companies { get; set; } = new List<Company>();
}