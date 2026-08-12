using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Doctor
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 4)]
    public string MedicalLicenseNumber { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Specialty { get; set; }

    [StringLength(100)]
    public string? LicenseAuthority { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? Email { get; set; }

    [EmailAddress]
    [StringLength(150)]
    public string? PEC { get; set; }

    [Phone]
    [StringLength(30)]
    public string? Phone { get; set; }

    [StringLength(200)]
    public string? SignatureImageUrl { get; set; }

    [StringLength(200)]
    public string? DigitalCertificateThumbprint { get; set; }

    public DateTime? DigitalCertificateExpiry { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<MedicalVisit> MedicalVisits { get; set; } = new List<MedicalVisit>();
    public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
    public ICollection<CompanyDoctor> CompanyDoctors { get; set; } = new List<CompanyDoctor>();
}