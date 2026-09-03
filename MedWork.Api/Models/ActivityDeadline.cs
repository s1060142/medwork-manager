using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class ActivityDeadline
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }

    [Required]
    [StringLength(200)]
    public string ActivityType { get; set; } = string.Empty;

    [Required]
    public DateTime DeadlineDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "To Do"; // To Do, In Progress, Done

    [StringLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Company? Company { get; set; }
}
