using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class DoctorAvailability
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int DoctorId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    [StringLength(100)]
    public string? Location { get; set; }

    public bool IsRecurring { get; set; } = true;

    public DateTime? ValidFrom { get; set; }

    public DateTime? ValidTo { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Doctor? Doctor { get; set; }
}