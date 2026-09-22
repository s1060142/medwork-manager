using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class StaffAbsence
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int DoctorId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Reason { get; set; } = "Ferie"; // Ferie, Malattia, Congresso, Permesso

    [StringLength(500)]
    public string? Notes { get; set; }

    public int? SubstituteDoctorId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Doctor? Doctor { get; set; }
    public Doctor? SubstituteDoctor { get; set; }
}
