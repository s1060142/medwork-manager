using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

/// <summary>
/// Preventivo/Offerta (pre-fattura)
/// </summary>
public class Quote
{
    public int Id { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    [Required]
    [Range(1, 999999999)]
    public int Number { get; set; }

    [Required]
    [Range(2000, 2100)]
    public int Year { get; set; }

    [Required]
    public DateTime IssueDate { get; set; }

    public DateTime? ValidityDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TaxableAmount { get; set; }

    [Range(0, double.MaxValue)]
    public decimal VatAmount { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TotalAmount { get; set; }

    [Required]
    [StringLength(30)]
    public string Status { get; set; } = "Bozza"; // Bozza, Inviato, Accettato, Rifiutato, Scaduto, Convertito

    [StringLength(2000)]
    public string? Notes { get; set; }

    [StringLength(50000)]
    public string? LinesJson { get; set; }

    [StringLength(5000)]
    public string? PaymentDataJson { get; set; }

    public int? ConvertedToInvoiceId { get; set; }
    public ElectronicInvoice? ConvertedToInvoice { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
}

/// <summary>
/// Riga preventivo
/// </summary>
public class QuoteLine
{
    public int LineNumber { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = "NR";
    public decimal UnitPrice { get; set; }
    public decimal DiscountRate { get; set; } = 0;
    public decimal NetAmount { get; set; }
    public decimal VatRate { get; set; } = 22;
    public string VatNature { get; set; } = "N1";
    public string? ReferenceItemCode { get; set; }
}