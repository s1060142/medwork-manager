using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Vaccination
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    [Required]
    [StringLength(150)]
    public string VaccineName { get; set; } = string.Empty;

    /// <summary>
    /// Data di somministrazione
    /// </summary>
    public DateTime DateAdministered { get; set; }

    /// <summary>
    /// Prossima scadenza
    /// </summary>
    public DateTime? NextDueDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public int? PeriodMonths { get; set; }

    public bool IsInvoiced { get; set; }

    public int? InvoiceNumber { get; set; }
    public int? InvoiceYear { get; set; }

    /// <summary>
    /// Data scadenza (alias per compatibilità)
    /// </summary>
    public DateTime? ExpiryDate { get; set; }
}
