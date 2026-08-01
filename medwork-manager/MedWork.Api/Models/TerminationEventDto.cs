using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// DTO per evento cessazione rapporto da sistema HR
/// </summary>
public class TerminationEventDto
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    [StringLength(16)]
    public string TaxCode { get; set; } = string.Empty;

    public int EmployeeId { get; set; }

    [Required]
    public DateTime TerminationDate { get; set; }

    [Required]
    [StringLength(50)]
    public string TerminationReason { get; set; } = string.Empty; // "Dimissioni", "Licenziamento", "Pensionamento", "Scadenza contratto"

    [StringLength(1000)]
    public string? Notes { get; set; }
}
