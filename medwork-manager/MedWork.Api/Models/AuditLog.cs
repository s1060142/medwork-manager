using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class AuditLog
{
    public long Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Action { get; set; } = string.Empty;

    [StringLength(100)]
    public string? EntityType { get; set; }

    public int? EntityId { get; set; }

    [StringLength(4000)]
    public string? OldValues { get; set; }

    [StringLength(4000)]
    public string? NewValues { get; set; }

    [StringLength(50)]
    public string? IpAddress { get; set; }

    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Timestamp UTC (alias per Timestamp per compatibilità)
    /// </summary>
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp (legacy)
    /// </summary>
    public DateTime Timestamp 
    { 
        get => TimestampUtc; 
        set => TimestampUtc = value; 
    }

    public int? CompanyId { get; set; }

    // Added fields for AuditService
    [StringLength(50)]
    public string? Role { get; set; }

    [StringLength(100)]
    public string? EntityName { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Source { get; set; }
}
