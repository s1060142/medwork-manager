using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Accreditamento/Scadenza per il modulo Scadenzario
/// </summary>
public class Accreditation
{
    public int Id { get; set; }

    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [Range(1, int.MaxValue)]
    public int? BranchId { get; set; }
    public Branch? Branch { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty; // "Medico", "Formazione", "DPI", "Sorveglianza", "Altro"

    [Required]
    public DateTime ExpiryDate { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Programmato"; // "Programmato", "Erogato", "Scaduto", "In corso", "Annullato"

    public DateTime? CompletionDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int? JobRoleId { get; set; }
    public JobRole? JobRole { get; set; }

    public int? RiskFactorId { get; set; }
    public RiskFactor? RiskFactor { get; set; }

    public int? ProtocolId { get; set; }
    public Protocol? Protocol { get; set; }

    [StringLength(120)]
    public string? ResponsiblePerson { get; set; }

    [StringLength(150)]
    public string? ResponsibleEmail { get; set; }

    public bool IsRecurring { get; set; } = false;

    public int? RecurrenceMonths { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [StringLength(120)]
    public string? CreatedBy { get; set; }
}