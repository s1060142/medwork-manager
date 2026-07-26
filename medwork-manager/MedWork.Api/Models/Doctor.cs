using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Doctor
{
    public int Id { get; set; }

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

    [EmailAddress]
    [StringLength(150)]
    public string? Email { get; set; }

    public ICollection<MedicalVisit> MedicalVisits { get; set; } = new List<MedicalVisit>();
    public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
}
