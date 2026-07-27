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

    /// <summary>
    /// Chiave NON cifrata usata per il deduplicamento dei promemoria automatici.
    /// Evita di eseguire predicati LIKE sulla colonna MessageText (cifrata), che genererebbe
    /// un errore SQL "invalid escape character in LIKE" (Error 506) a causa dei caratteri
    /// _ [ ] presenti nel testo cifrato.
    /// </summary>
    [StringLength(120)]
    public string? ReminderKey { get; set; }

    public Employee? Employee { get; set; }
}