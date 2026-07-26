using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class NotificationLog
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    public NotificationChannel Channel { get; set; }

    public DateTime SentDate { get; set; } = DateTime.UtcNow;

    [Required]
    [StringLength(2000, MinimumLength = 2)]
    public string MessageText { get; set; } = string.Empty;

    public Employee? Employee { get; set; }
}