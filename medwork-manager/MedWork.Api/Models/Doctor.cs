using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Doctor
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string MedicalLicenseNumber { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Specialty { get; set; }

    [StringLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    [StringLength(30)]
    [Phone]
    public string? Phone { get; set; }

    [StringLength(250)]
    public string? Address { get; set; }

    public ICollection<MedicalVisit> MedicalVisits { get; set; } = new List<MedicalVisit>();
    public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
}
