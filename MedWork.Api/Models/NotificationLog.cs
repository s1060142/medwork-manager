using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MedWork.Api.Models;

public class NotificationLog
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int? EmployeeId { get; set; }

    [StringLength(150)]
    public string? Email { get; set; }

    public NotificationChannel Channel { get; set; }

    public DateTime SentDate { get; set; } = DateTime.UtcNow;

    [Required]
    [StringLength(2000, MinimumLength = 2)]
    public string MessageText { get; set; } = string.Empty;

    public bool IsDelivered { get; set; } = false;

    public DateTime? DeliveredAt { get; set; }

    [StringLength(500)]
    public string? ErrorMessage { get; set; }

    public int RetryCount { get; set; } = 0;

    // Navigation properties
    [JsonIgnore]
    public Tenant? Tenant { get; set; }
    [JsonIgnore]
    public Employee? Employee { get; set; }
}