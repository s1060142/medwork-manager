using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Appointment
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    public int? CompanyId { get; set; }

    [Range(1, int.MaxValue)]
    public int DoctorId { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    [StringLength(100)]
    public string? Location { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Available"; // Available, Pending, Booked, Cancelled

    public int TotalSlots { get; set; } = 1;

    public int BookedSlots { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
    public Doctor? Doctor { get; set; }
}
