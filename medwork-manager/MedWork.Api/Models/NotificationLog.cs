using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class NotificationLog
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public NotificationChannel Channel { get; set; }

    [Required]
    [StringLength(2000)]
    public string MessageText { get; set; } = string.Empty;

    [StringLength(120)]
    public string? ReminderKey { get; set; }

    /// <summary>
    /// Data invio (alias per SentAt per compatibilità)
    /// </summary>
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Data invio (alias legacy)
    /// </summary>
    public DateTime SentDate 
    { 
        get => SentAt; 
        set => SentAt = value; 
    }

    public bool IsDelivered { get; set; }
    public DateTime? DeliveredAt { get; set; }

    [StringLength(500)]
    public string? ErrorMessage { get; set; }
}