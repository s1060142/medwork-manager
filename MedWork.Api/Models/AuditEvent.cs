using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class AuditEvent
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [StringLength(120)]
    public string? UserName { get; set; }

    [Required]
    [StringLength(80)]
    public string Module { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string Action { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Detail { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [StringLength(45)]
    public string? IpAddress { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
}
