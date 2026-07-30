using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class Journal
{
    public int Id { get; set; }

    public DateTime Date { get; set; }

    [Required]
    [StringLength(100)]
    public string Type { get; set; } = string.Empty; // Visita, Sopralluogo, Fattura, ecc.

    public int ReferenceId { get; set; }

    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    public decimal? Amount { get; set; }

    [StringLength(120)]
    public string? Operator { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }
}
