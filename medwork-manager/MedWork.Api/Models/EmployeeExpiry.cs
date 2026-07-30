using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class EmployeeExpiry
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    [StringLength(50)]
    public string ExpiryType { get; set; } = string.Empty; // Visita, Vaccinazione, Esame, Formazione, DPI

    public int? ReferenceId { get; set; } // ID visita, vaccinazione, esame, ecc.

    public DateTime ExpiryDate { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "In scadenza"; // In scadenza, Scaduto, Rinnovato

    public bool NoExpiry { get; set; } = false;

    public DateTime? LastNotificationDate { get; set; }
    public int NotificationCount { get; set; } = 0;
}
